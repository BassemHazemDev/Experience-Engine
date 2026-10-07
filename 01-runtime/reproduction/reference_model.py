#!/usr/bin/env python3
from collections import defaultdict
import random, json

class ReferenceETP:
    """Independent semantic model of:
       Normalize -> Resolve -> Diff -> Seeds -> Closure -> Prepare -> Commit
    """
    def __init__(self, graph):
        self.graph = {k:set(v) for k,v in graph.items()}
        self.current = None
        self.generation = 0

    def normalize(self, req):
        return {
            "culture": req["culture"],
            "theme": req["theme"],
            "motion": req.get("motion", "instant"),
        }

    def resolve(self, req):
        x = self.normalize(req)
        return {"id": f'{x["culture"]}|{x["theme"]}|{x["motion"]}', **x}

    def delta(self, old, new):
        return {
            "culture": old is None or old["culture"] != new["culture"],
            "theme": old is None or old["theme"] != new["theme"],
            "motion": old is None or old["motion"] != new["motion"],
        }

    def closure(self, seeds):
        out = set(seeds)
        queue = list(seeds)
        while queue:
            src = queue.pop()
            for dst in self.graph.get(src, ()):
                if dst not in out:
                    out.add(dst)
                    queue.append(dst)
        return out

    def transition(self, req, fail_nodes=()):
        target = self.resolve(req)
        d = self.delta(self.current, target)
        seeds = {k for k,v in d.items() if v}
        affected = self.closure(seeds)
        self.generation += 1
        if set(fail_nodes) & affected:
            return {"status":"FAILED", "target":target["id"], "affected":sorted(affected)}
        self.current = dict(target)
        return {"status":"COMMITTED", "target":target["id"], "affected":sorted(affected)}

def main():
    graph = {
        "culture":{"direction","translation","font","component"},
        "theme":{"tokens","font","asset"},
        "motion":{"animation"},
        "direction":{"layout"},
        "tokens":{"component"},
    }
    r = ReferenceETP(graph)
    r.current = r.resolve({"culture":"en-US","theme":"light","motion":"instant"})

    # Deterministic identities.
    ids = [r.resolve({"culture":"ar-EG","theme":"luxury","motion":"smooth"})["id"] for _ in range(1000)]
    identity_ok = len(set(ids)) == 1

    # Closure check.
    expected = {"theme","tokens","font","asset","component"}
    closure_ok = r.closure({"theme"}) == expected

    # Failure preservation.
    before = dict(r.current)
    failure = r.transition(
        {"culture":"ar-EG","theme":"luxury","motion":"smooth"},
        fail_nodes=["translation"]
    )
    failure_ok = failure["status"] == "FAILED" and r.current == before

    # 5000 randomized transitions; deterministic seed.
    random.seed(80080)
    failures = 0
    for _ in range(5000):
        req = {
            "culture": random.choice(["en-US","ar-EG","fr-FR"]),
            "theme": random.choice(["light","dark","luxury"]),
            "motion": random.choice(["instant","smooth","cinematic"]),
        }
        old = dict(r.current)
        target = r.resolve(req)
        d = r.delta(r.current, target)
        seeds = {k for k,v in d.items() if v}
        affected = r.closure(seeds)
        fail = []
        if random.random() < 0.10 and affected:
            fail = [random.choice(sorted(affected))]
        out = r.transition(req, fail)
        if out["status"] == "FAILED" and r.current != old:
            failures += 1

    result = {
        "status":"PASS" if identity_ok and closure_ok and failure_ok and failures == 0 else "FAIL",
        "identity_1000":identity_ok,
        "theme_closure":closure_ok,
        "failure_preservation":failure_ok,
        "random_trials":5000,
        "random_failure_preservation_violations":failures,
        "final_id":r.current["id"],
    }
    print(json.dumps(result, indent=2))
    return 0 if result["status"]=="PASS" else 1

if __name__ == "__main__":
    raise SystemExit(main())
