$key = "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"

Write-Host "=== Testing OpenRouter API Key ===" -ForegroundColor Cyan

# Test key info
try {
  $info = Invoke-RestMethod -Uri "https://openrouter.ai/api/v1/auth/key" `
    -Headers @{ Authorization = "Bearer $key" } `
    -ErrorAction Stop
  Write-Host "Key valid! Usage: $($info.data | ConvertTo-Json)" -ForegroundColor Green
} catch {
  Write-Host "Key info error: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
}

# Test free model
$models = @(
  "meta-llama/llama-3.1-8b-instruct:free",
  "mistralai/mistral-7b-instruct:free",
  "google/gemma-3-4b-it:free"
)

$body = @{
  messages = @(@{ role = "user"; content = "Say: OK" })
  max_tokens = 10
  stream = $false
} | ConvertTo-Json

foreach ($model in $models) {
  $body2 = ($body | ConvertFrom-Json)
  $body2 | Add-Member -Name "model" -Value $model -MemberType NoteProperty
  $bodyStr = $body2 | ConvertTo-Json

  try {
    $resp = Invoke-RestMethod -Uri "https://openrouter.ai/api/v1/chat/completions" `
      -Method POST `
      -Headers @{ Authorization = "Bearer $key"; "Content-Type" = "application/json" } `
      -Body $bodyStr `
      -ErrorAction Stop
    Write-Host "[$model] SUCCESS: $($resp.choices[0].message.content)" -ForegroundColor Green
    break
  } catch {
    Write-Host "[$model] FAIL: $($_.ErrorDetails.Message)" -ForegroundColor Red
  }
}
