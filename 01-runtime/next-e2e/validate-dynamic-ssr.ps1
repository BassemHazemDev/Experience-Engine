$ErrorActionPreference = "Stop"

$baseUrl = "http://localhost:3000/personalized"

function Get-ServerExperience {
  param(
    [string]$Cookie
  )

  $response = Invoke-WebRequest `
    -Uri $baseUrl `
    -Headers @{ Cookie = "experience=$Cookie" }

  $content = $response.Content

  function Extract([string]$pattern) {
    $match = [regex]::Match($content, $pattern)
    if (-not $match.Success) {
      throw "Missing expected server marker: $pattern"
    }
    return $match.Groups[1].Value
  }

  [pscustomobject]@{
    statusCode = $response.StatusCode
    id = Extract 'data-server-experience-id="([^"]+)"'
    culture = Extract 'data-server-culture="([^"]+)"'
    theme = Extract 'data-server-theme="([^"]+)"'
    motion = Extract 'data-server-motion="([^"]+)"'
    direction = Extract 'data-server-direction="([^"]+)"'
  }
}

$arabic = Get-ServerExperience "ar-EG.luxury.smooth"
$english = Get-ServerExperience "en-US.light.instant"

$arabicPass =
  $arabic.statusCode -eq 200 -and
  $arabic.id -eq "ar-EG::luxury::smooth" -and
  $arabic.culture -eq "ar-EG" -and
  $arabic.theme -eq "luxury" -and
  $arabic.motion -eq "smooth" -and
  $arabic.direction -eq "rtl"

$englishPass =
  $english.statusCode -eq 200 -and
  $english.id -eq "en-US::light::instant" -and
  $english.culture -eq "en-US" -and
  $english.theme -eq "light" -and
  $english.motion -eq "instant" -and
  $english.direction -eq "ltr"

$sameRouteDifferentOutput =
  $arabic.id -ne $english.id

$result = [ordered]@{
  status = if ($arabicPass -and $englishPass -and $sameRouteDifferentOutput) { "PASS" } else { "FAIL" }
  route = "/personalized"
  requestTimeCookiePersonalization = $true
  sameRouteDifferentServerOutput = $sameRouteDifferentOutput
  cases = @(
    [ordered]@{
      cookie = "ar-EG.luxury.smooth"
      response = $arabic
      assertions = @{
        exactResolvedIdentity = ($arabic.id -eq "ar-EG::luxury::smooth")
        culture = ($arabic.culture -eq "ar-EG")
        theme = ($arabic.theme -eq "luxury")
        motion = ($arabic.motion -eq "smooth")
        direction = ($arabic.direction -eq "rtl")
      }
    },
    [ordered]@{
      cookie = "en-US.light.instant"
      response = $english
      assertions = @{
        exactResolvedIdentity = ($english.id -eq "en-US::light::instant")
        culture = ($english.culture -eq "en-US")
        theme = ($english.theme -eq "light")
        motion = ($english.motion -eq "instant")
        direction = ($english.direction -eq "ltr")
      }
    }
  )
  checkedAt = (Get-Date).ToUniversalTime().ToString("o")
}

$result | ConvertTo-Json -Depth 8
