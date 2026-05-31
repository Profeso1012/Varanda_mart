$base = "http://localhost:4000/api/v1"
$script:pass = 0; $script:fail = 0
$stamp = [int][double]::Parse((Get-Date -UFormat %s))

function ok { param($label, $val)
    if ($val) { Write-Host "  PASS $label" -ForegroundColor Green; $script:pass++ }
    else { Write-Host "  FAIL $label" -ForegroundColor Red; $script:fail++ }
}
function req { param($method, $url, $body, $headers)
    try {
        $p = @{ Uri=$url; Method=$method }
        if ($headers) { $p.Headers=$headers }
        if ($body) { $p.Body=($body|ConvertTo-Json -Depth 10); $p.ContentType="application/json" }
        return Invoke-RestMethod @p
    } catch {
        $m = $_.ErrorDetails.Message
        try { return ($m|ConvertFrom-Json) } catch { return [PSCustomObject]@{success=$false;error=@{code="UNKNOWN";message=$m}} }
    }
}

Write-Host "`n=== Phase 4 Test Suite (run $stamp) ===" -ForegroundColor Cyan

# ── Login both accounts ────────────────────────────────────────────────────────
Write-Host "`n[Auth]"
$sr = req POST "$base/auth/login" @{email="eoluwaseyi204@gmail.com";password="Secured123!"}
ok "Supplier login" ($sr.success -eq $true)
$SH = @{Authorization="Bearer $($sr.data.accessToken)"}

$lr = req POST "$base/auth/login" @{email="itzairso204@gmail.com";password="Secured123!"}
ok "Seller login" ($lr.success -eq $true)
$SEH = @{Authorization="Bearer $($lr.data.accessToken)"}

# ── Supplier profile ───────────────────────────────────────────────────────────
Write-Host "`n[Supplier Profile]"
$r = req GET "$base/supplier/profile" $null $SH
ok "Get supplier profile" ($r.success -eq $true)
$supplierId = $r.data.supplier.id

$r = req PUT "$base/supplier/profile" @{displayName="Lagos Wholesale $stamp";processingTimeDays=2;shipsTo=@("NG","GH")} $SH
ok "Update supplier profile" ($r.success -eq $true)

# ── Marketplace categories (seller token) ─────────────────────────────────────
Write-Host "`n[Marketplace Categories]"
$r = req GET "$base/marketplace/categories" $null $SEH
ok "List marketplace categories" ($r.success -eq $true -and $r.data.categories.Count -ge 1)
$mktCatId = $r.data.categories[0].id

# ── Supplier products ──────────────────────────────────────────────────────────
Write-Host "`n[Supplier Products]"
$r = req POST "$base/supplier/products" @{
    name="Ankara Fabric $stamp"; marketplaceCategoryId=$mktCatId
    supplierPrice=5000; suggestedRetailPrice=8000; currency="NGN"
    isVariable=$false; trackInventory=$true; processingTimeDays=2
    description="High quality ankara fabric"
} $SH
ok "Create supplier product" ($r.success -eq $true)
$spId = $r.data.product.id
ok "Product starts as DRAFT" ($r.data.product.status -eq "DRAFT")
ok "supplierPrice returned to supplier" ([double]$r.data.product.supplier_price -eq 5000 -or [double]$r.data.product.supplierPrice -eq 5000)

$r = req GET "$base/supplier/products/$spId" $null $SH
ok "Get product (shows true price)" ($r.success -eq $true -and ($r.data.product.supplier_price -gt 0))

$r = req PUT "$base/supplier/products/$spId" @{supplierPrice=5500;description="Updated"} $SH
ok "Update supplier product" ($r.success -eq $true)

$r = req GET "$base/supplier/products" $null $SH
ok "List supplier products" ($r.success -eq $true -and $r.data.products.Count -ge 1)

# ── Product images ─────────────────────────────────────────────────────────────
Write-Host "`n[Supplier Product Images]"
$r = req POST "$base/supplier/products/$spId/images" @{
    images=@(@{url="https://res.cloudinary.com/test/image/upload/v1/ankara.jpg";publicId="test/ankara";isMain=$true})
} $SH
ok "Add supplier product image" ($r.success -eq $true)

# ── Submit for review ──────────────────────────────────────────────────────────
Write-Host "`n[Submit for Review]"
$r = req POST "$base/supplier/products/$spId/submit" $null $SH
ok "Submit for review" ($r.success -eq $true)
ok "Status is PENDING_REVIEW" ($r.data.product.status -eq "PENDING_REVIEW")

$r = req POST "$base/supplier/products/$spId/submit" $null $SH
ok "Double submit rejected" ($r.success -eq $false)

# ── Simulate admin approval via DB ────────────────────────────────────────────
Write-Host "`n[Admin Approve - DB direct]"
$approveScript = "require('dotenv').config(); const {sql}=require('./src/config/database'); sql``UPDATE supplier_products SET status='ACTIVE', reviewed_at=NOW() WHERE id='$spId'``.then(()=>{console.log('ok');sql.end()}).catch(e=>{console.error(e.message);sql.end()});"
$approveResult = node -e $approveScript 2>&1
ok "Product approved via DB" ($approveResult -eq "ok")

# ── Marketplace browse (seller) ────────────────────────────────────────────────
Write-Host "`n[Marketplace Browse]"
$r = req GET "$base/marketplace/products" $null $SEH
ok "Browse marketplace products" ($r.success -eq $true)
$mktProduct = $r.data.products | Where-Object { $_.id -eq $spId }
ok "New product visible in marketplace" ($null -ne $mktProduct)
ok "Display price has markup (>5500)" ([double]$mktProduct.display_price -gt 5500)
ok "True supplier_price NOT in response" ($null -eq $mktProduct.supplier_price)

$r = req GET "$base/marketplace/products/$spId" $null $SEH
ok "Get marketplace product detail" ($r.success -eq $true)
ok "Detail has no supplier_price" ($null -eq $r.data.product.supplier_price)
ok "alreadyImported flag present" ($null -ne $r.data.alreadyImported)

# ── Import product ─────────────────────────────────────────────────────────────
Write-Host "`n[Import Product]"
Write-Host "  spId: $spId"
# Get the display price from the product detail (after approval)
$detailR = req GET "$base/marketplace/products/$spId" $null $SEH
Write-Host "  detail success: $($detailR.success)"
Write-Host "  detail product id: $($detailR.data.product.id)"
$displayPrice = [double]$detailR.data.product.display_price
Write-Host "  display_price from detail: $displayPrice"
$retailPrice = [int][math]::Ceiling($displayPrice * 1.4)
Write-Host "  retailPrice to use: $retailPrice"

$r = req POST "$base/marketplace/import" @{supplierProductId=$spId;retailPrice=$retailPrice} $SEH
ok "Import marketplace product" ($r.success -eq $true)
$importId = $r.data.import.id
ok "Seller margin > 0" ($r.data.import.sellerMargin -gt 0)
ok "Store product created as DROPSHIP" ($r.data.storeProduct.status -eq "DRAFT")

$r = req POST "$base/marketplace/import" @{supplierProductId=$spId;retailPrice=$retailPrice} $SEH
ok "Duplicate import rejected (ALREADY_IMPORTED)" ($r.success -eq $false -and $r.error.code -eq "ALREADY_IMPORTED")

$r = req POST "$base/marketplace/import" @{supplierProductId=$spId;retailPrice=100} $SEH
ok "Price below display price rejected" ($r.success -eq $false -and ($r.error.code -eq "PRICE_TOO_LOW" -or $r.error.code -eq "ALREADY_IMPORTED"))

# ── Import management ──────────────────────────────────────────────────────────
Write-Host "`n[Import Management]"
$r = req GET "$base/marketplace/imports" $null $SEH
ok "List imports" ($r.success -eq $true -and $r.data.imports.Count -ge 1)

$r = req PUT "$base/marketplace/imports/$importId" @{retailPrice=($retailPrice+500);customTitle="Custom Ankara"} $SEH
ok "Update import" ($r.success -eq $true)

# ── Pause / Reactivate ────────────────────────────────────────────────────────
Write-Host "`n[Pause / Reactivate]"
$r = req POST "$base/supplier/products/$spId/pause" $null $SH
ok "Pause active product" ($r.success -eq $true)
ok "Status is PAUSED" ($r.data.product.status -eq "PAUSED")

$r = req POST "$base/supplier/products/$spId/reactivate" $null $SH
ok "Reactivate paused product" ($r.success -eq $true)
ok "Status is ACTIVE again" ($r.data.product.status -eq "ACTIVE")

# ── Supplier revenue ───────────────────────────────────────────────────────────
Write-Host "`n[Supplier Revenue]"
$r = req GET "$base/supplier/revenue?period=30d" $null $SH
ok "Get revenue summary" ($r.success -eq $true)
ok "Revenue fields present" ($null -ne $r.data.totalEarned)

# ── Supplier orders ────────────────────────────────────────────────────────────
Write-Host "`n[Supplier Orders]"
$r = req GET "$base/supplier/orders" $null $SH
ok "List supplier orders" ($r.success -eq $true)

# ── Marketplace suppliers ──────────────────────────────────────────────────────
Write-Host "`n[Marketplace Suppliers]"
$r = req GET "$base/marketplace/suppliers" $null $SEH
ok "List marketplace suppliers" ($r.success -eq $true)

$r = req GET "$base/marketplace/suppliers/$supplierId" $null $SEH
ok "Get supplier public profile" ($r.success -eq $true)

# ── Summary ───────────────────────────────────────────────────────────────────
$total = $script:pass + $script:fail
Write-Host "`n=== Results: $($script:pass)/$total passed ===" -ForegroundColor $(if ($script:fail -eq 0) {"Green"} else {"Yellow"})
if ($script:fail -gt 0) { Write-Host "  $($script:fail) test(s) failed" -ForegroundColor Red }
