$base = "http://localhost:4000/api/v1"
$script:pass = 0
$script:fail = 0

function ok {
    param($label, $val)
    if ($val) {
        Write-Host "  PASS $label" -ForegroundColor Green
        $script:pass++
    } else {
        Write-Host "  FAIL $label" -ForegroundColor Red
        $script:fail++
    }
}

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
        try { return ($msg | ConvertFrom-Json) } catch { return [PSCustomObject]@{ success = $false; error = @{ code = "UNKNOWN"; message = $msg } } }
    }
}

$stamp = [int][double]::Parse((Get-Date -UFormat %s))

Write-Host "`n=== Phase 3 Test Suite (run $stamp) ===" -ForegroundColor Cyan

# ── Login ─────────────────────────────────────────────────────────────────────
Write-Host "`n[Auth]"
$r = req POST "$base/auth/login" @{email="itzairso204@gmail.com";password="Secured123!"}
ok "Login succeeds" ($r.success -eq $true)
$H = @{Authorization="Bearer $($r.data.accessToken)"}
ok "Token received" ($r.data.accessToken.Length -gt 10)

# ── Categories ────────────────────────────────────────────────────────────────
Write-Host "`n[Categories]"
$r = req POST "$base/catalog/categories" @{name="Footwear $stamp";description="Shoes";sortOrder=0} $H
ok "Create root category" ($r.success -eq $true)
$catId = $r.data.category.id

$r = req POST "$base/catalog/categories" @{name="Sneakers $stamp";parentId=$catId} $H
ok "Create subcategory (depth 1)" ($r.success -eq $true)
$subId = $r.data.category.id

# 3rd level should be rejected
$r = req POST "$base/catalog/categories" @{name="TooDeep";parentId=$subId} $H
ok "3rd-level depth rejected" ($r.success -eq $false -and $r.error.code -eq "DEPTH_LIMIT")

$r = req GET "$base/catalog/categories" $null $H
ok "List categories as tree" ($r.success -eq $true -and $r.data.categories.Count -ge 1)

$r = req PUT "$base/catalog/categories/$catId" @{description="Updated";isActive=$true} $H
ok "Update category" ($r.success -eq $true)

# ── Tags ──────────────────────────────────────────────────────────────────────
Write-Host "`n[Tags]"
$r = req POST "$base/catalog/product-tags" @{name="Phase3Tag $stamp"} $H
ok "Create tag" ($r.success -eq $true)
$tagId = $r.data.tag.id

$r = req GET "$base/catalog/product-tags" $null $H
ok "List tags" ($r.success -eq $true)

$r = req POST "$base/catalog/product-tags" @{name="Phase3Tag $stamp"} $H
ok "Duplicate tag rejected" ($r.success -eq $false -and $r.error.code -eq "CONFLICT")

# ── Option types ──────────────────────────────────────────────────────────────
Write-Host "`n[Variant Option Types]"
$r = req POST "$base/catalog/variant-option-types" @{name="Shoe Size $stamp";displayType="TEXT"} $H
ok "Create option type" ($r.success -eq $true)
$otId = $r.data.optionType.id

$r = req POST "$base/catalog/variant-option-types/$otId/values" @{value="42";sortOrder=0} $H
ok "Create option value 42" ($r.success -eq $true)
$ovId = $r.data.optionValue.id

$r = req POST "$base/catalog/variant-option-types/$otId/values" @{value="43";sortOrder=1} $H
ok "Create option value 43" ($r.success -eq $true)
$ovId2 = $r.data.optionValue.id

$r = req GET "$base/catalog/variant-option-types" $null $H
ok "List option types with nested values" ($r.success -eq $true -and $r.data.optionTypes.Count -ge 1)

# ── Products ──────────────────────────────────────────────────────────────────
Write-Host "`n[Products]"
$r = req POST "$base/catalog/products" @{
    name="Air Force Sneaker $stamp"; basePrice=25000; status="ACTIVE"
    isVariable=$true; trackInventory=$true; categoryId=$catId; tagIds=@($tagId)
} $H
ok "Create variable product" ($r.success -eq $true)
$prodId = $r.data.product.id

$r = req GET "$base/catalog/products/$prodId" $null $H
ok "Get product full detail" ($r.success -eq $true)
ok "Product has tag assigned" ($r.data.product.tags.Count -eq 1)

$r = req PUT "$base/catalog/products/$prodId" @{basePrice=27000;status="ACTIVE"} $H
ok "Update product price" ($r.success -eq $true)

$r = req GET "$base/catalog/products?status=ACTIVE" $null $H
ok "List active products" ($r.success -eq $true -and $r.data.products.Count -ge 1)

# ── Product images ────────────────────────────────────────────────────────────
Write-Host "`n[Product Images]"
$r = req POST "$base/catalog/products/$prodId/images" @{
    images=@(@{url="https://res.cloudinary.com/test/image/upload/v1/shoe.jpg";publicId="test/shoe";isMain=$true})
} $H
ok "Add product image" ($r.success -eq $true)
$imgId = $r.data.images[0].id

$r = req PUT "$base/catalog/products/$prodId/images/$imgId/set-main" $null $H
ok "Set main image" ($r.success -eq $true)

$r = req PUT "$base/catalog/products/$prodId/images/reorder" @{
    images=@(@{id=$imgId;sortOrder=0})
} $H
ok "Reorder images" ($r.success -eq $true)

# ── Variants ──────────────────────────────────────────────────────────────────
Write-Host "`n[Variants]"
$r = req POST "$base/catalog/products/$prodId/variants" @{
    price=25000; stockQuantity=30; optionValueIds=@($ovId); sku="AF-42"
} $H
ok "Create variant size 42" ($r.success -eq $true)
$varId = $r.data.variant.id

$r = req POST "$base/catalog/products/$prodId/variants" @{
    price=25000; stockQuantity=20; optionValueIds=@($ovId2); sku="AF-43"
} $H
ok "Create variant size 43" ($r.success -eq $true)
$varId2 = $r.data.variant.id

$r = req POST "$base/catalog/products/$prodId/variants" @{
    price=25000; stockQuantity=10; optionValueIds=@($ovId)
} $H
ok "Duplicate variant combination rejected" ($r.success -eq $false -and $r.error.code -eq "DUPLICATE_VARIANT")

$r = req PUT "$base/catalog/products/$prodId/variants/$varId" @{stockQuantity=35;price=26000} $H
ok "Update variant" ($r.success -eq $true)

$r = req POST "$base/catalog/products/$prodId/variants/bulk-stock" @{
    updates=@(@{variantId=$varId;stockQuantity=50},@{variantId=$varId2;stockQuantity=40})
} $H
ok "Bulk stock update" ($r.success -eq $true)

# ── Inventory ─────────────────────────────────────────────────────────────────
Write-Host "`n[Inventory]"
$r = req POST "$base/inventory/adjust" @{
    variantId=$varId; quantityChange=-5; movementType="MANUAL_DECREASE"; note="Damaged stock"
} $H
ok "Adjust stock down" ($r.success -eq $true)
ok "Stock after = 45" ($r.data.stockAfter -eq 45)

$r = req POST "$base/inventory/adjust" @{
    variantId=$varId; quantityChange=10; movementType="MANUAL_INCREASE"; note="Restock"
} $H
ok "Adjust stock up" ($r.success -eq $true)
ok "Stock after = 55" ($r.data.stockAfter -eq 55)

$r = req POST "$base/inventory/adjust" @{
    variantId=$varId; quantityChange=-999; movementType="MANUAL_DECREASE"
} $H
ok "Below-zero stock rejected" ($r.success -eq $false -and $r.error.code -eq "INVALID_STOCK")

$r = req GET "$base/inventory/movements" $null $H
ok "List stock movements" ($r.success -eq $true -and $r.data.movements.Count -ge 2)

$r = req GET "$base/inventory/low-stock?threshold=60" $null $H
ok "Low stock list (threshold 60)" ($r.success -eq $true -and $r.data.variants.Count -ge 1)

# ── Duplicate product ─────────────────────────────────────────────────────────
Write-Host "`n[Duplicate]"
$r = req POST "$base/catalog/products/$prodId/duplicate" $null $H
ok "Duplicate product" ($r.success -eq $true)
ok "Duplicate has Copy in name" ($r.data.product.name -like "*Copy*")
ok "Duplicate is DRAFT" ($r.data.product.status -eq "DRAFT")

# ── Bundles ───────────────────────────────────────────────────────────────────
Write-Host "`n[Bundles]"
$r = req POST "$base/catalog/bundles" @{
    name="Sneaker Bundle $stamp"; price=45000; description="Two pairs"
    items=@(@{productId=$prodId;quantity=2})
} $H
ok "Create bundle" ($r.success -eq $true)
$bundleId = $r.data.bundle.id

$r = req GET "$base/catalog/bundles/$bundleId" $null $H
ok "Get bundle detail" ($r.success -eq $true)
ok "Bundle has 1 item" ($r.data.bundle.items.Count -eq 1)

$r = req PUT "$base/catalog/bundles/$bundleId" @{price=42000;isActive=$true} $H
ok "Update bundle price" ($r.success -eq $true)

$r = req GET "$base/catalog/bundles" $null $H
ok "List bundles" ($r.success -eq $true -and $r.data.bundles.Count -ge 1)

# ── Discounts ─────────────────────────────────────────────────────────────────
Write-Host "`n[Discounts]"
$r = req POST "$base/discounts" @{
    code="P3T$stamp"; type="PERCENTAGE"; value=20; minimumOrder=10000; perCustomerLimit=1
} $H
ok "Create percentage discount" ($r.success -eq $true)
$discId = $r.data.discount.id

$r = req POST "$base/discounts" @{code="P3T$stamp";type="PERCENTAGE";value=20} $H
ok "Duplicate code rejected" ($r.success -eq $false -and $r.error.code -eq "CONFLICT")

$r = req POST "$base/discounts" @{code="FIX$stamp";type="FIXED_AMOUNT";value=2000} $H
ok "Create fixed amount discount" ($r.success -eq $true)

$r = req PUT "$base/discounts/$discId" @{value=25;isActive=$true} $H
ok "Update discount value" ($r.success -eq $true)

$r = req GET "$base/discounts" $null $H
ok "List discounts" ($r.success -eq $true -and $r.data.discounts.Count -ge 1)

$r = req GET "$base/discounts/$discId/usages" $null $H
ok "Get discount usages (empty)" ($r.success -eq $true)

# ── CSV template ──────────────────────────────────────────────────────────────
Write-Host "`n[CSV Import]"
try {
    $csv = Invoke-RestMethod -Uri "$base/catalog/products/import/template" -Headers $H
    ok "CSV template download" ($csv -like "*name*basePrice*")
} catch {
    ok "CSV template download" $false
}

# ── Validation errors ─────────────────────────────────────────────────────────
Write-Host "`n[Validation]"
$r = req POST "$base/catalog/products" @{name="";basePrice=-1} $H
ok "Empty name rejected" ($r.success -eq $false -and $r.error.code -eq "VALIDATION_ERROR")

$r = req POST "$base/discounts" @{code="X";type="INVALID";value=10} $H
ok "Invalid discount type rejected" ($r.success -eq $false -and $r.error.code -eq "VALIDATION_ERROR")

# ── Summary ───────────────────────────────────────────────────────────────────
$total = $script:pass + $script:fail
Write-Host "`n=== Results: $($script:pass)/$total passed ===" -ForegroundColor $(if ($script:fail -eq 0) {"Green"} else {"Yellow"})
if ($script:fail -gt 0) { Write-Host "  $($script:fail) test(s) failed" -ForegroundColor Red }
