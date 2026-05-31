$base = "http://localhost:4000/api/v1"

# Login
$loginBody = @{email="itzairso204@gmail.com";password="Secured123!"} | ConvertTo-Json
$r = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
$H = @{Authorization="Bearer $($r.data.accessToken)"}
Write-Host "Logged in. Token length: $($r.data.accessToken.Length)"

# ── Test 1: Direct call (no helper function) ──────────────────────────────────
Write-Host "`n[Direct call]"
$body = @{name="DirectCat$(Get-Random)";description="test"} | ConvertTo-Json
$rc = Invoke-RestMethod -Uri "$base/catalog/categories" -Method POST -ContentType "application/json" -Body $body -Headers $H
Write-Host "success: $($rc.success)"
Write-Host "id: $($rc.data.category.id)"
$directCatId = $rc.data.category.id
Write-Host "catId assigned: $directCatId"

# ── Test 2: Subcategory using direct catId ────────────────────────────────────
Write-Host "`n[Subcategory with direct catId]"
$subBody = @{name="SubCat$(Get-Random)";parentId=$directCatId} | ConvertTo-Json
Write-Host "Sending parentId: $directCatId"
$rs = Invoke-RestMethod -Uri "$base/catalog/categories" -Method POST -ContentType "application/json" -Body $subBody -Headers $H
Write-Host "success: $($rs.success)"
Write-Host "subcategory id: $($rs.data.category.id)"
Write-Host "subcategory parent_id: $($rs.data.category.parent_id)"

# ── Test 3: Simulate the req() function return ────────────────────────────────
Write-Host "`n[Via req() function]"
function req {
    param($method, $url, $body, $headers)
    try {
        $params = @{ Uri = $url; Method = $method }
        if ($headers) { $params.Headers = $headers }
        if ($body) {
            $params.Body = ($body | ConvertTo-Json -Depth 10)
            $params.ContentType = "application/json"
        }
        return Invoke-RestMethod @params
    } catch {
        $msg = $_.ErrorDetails.Message
        try { return ($msg | ConvertFrom-Json) }
        catch { return [PSCustomObject]@{ success = $false; error = @{ code = "UNKNOWN"; message = $msg } } }
    }
}

$r2 = req POST "$base/catalog/categories" @{name="ReqCat$(Get-Random)";description="via req"} $H
Write-Host "Type of r2: $($r2.GetType().FullName)"
Write-Host "success: $($r2.success)"
Write-Host "data: $($r2.data)"
Write-Host "category: $($r2.data.category)"
Write-Host "id via req: $($r2.data.category.id)"
$reqCatId = $r2.data.category.id
Write-Host "reqCatId assigned: '$reqCatId'"
Write-Host "reqCatId is null: $($null -eq $reqCatId)"
Write-Host "reqCatId length: $($reqCatId.Length)"

# ── Test 4: Subcategory using req() catId ─────────────────────────────────────
Write-Host "`n[Subcategory with req() catId]"
$r3 = req POST "$base/catalog/categories" @{name="SubViaReq$(Get-Random)";parentId=$reqCatId} $H
Write-Host "success: $($r3.success)"
if (-not $r3.success) { Write-Host "error: $($r3.error.message)" }
else { Write-Host "subcategory id: $($r3.data.category.id)" }
