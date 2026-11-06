#!/usr/bin/env pwsh
# 预检回归：每个用例故意做一个错误，验证 preflight 真的拦得住。
# 用法：pwsh scripts/preflight-fixtures.ps1
# 它跑的是真实 preflight（真启浏览器、真读文件），不是打桩。

$ErrorActionPreference = 'Stop'
$SK = Split-Path -Parent $PSScriptRoot
$TMP = Join-Path $env:TEMP 'pc-preflight-fixtures'
# Playwright 浏览器：优先用环境里已有的，不然从 local.json 的路径推
if (-not $env:PLAYWRIGHT_BROWSERS_PATH) {
  $cand = Join-Path (Split-Path -Parent (Split-Path -Parent $SK)) 'playwright-browsers'
  if (Test-Path $cand) { $env:PLAYWRIGHT_BROWSERS_PATH = $cand }
}
Write-Host "Playwright browsers: $env:PLAYWRIGHT_BROWSERS_PATH"

function NewFixture {
  param([string]$Name, [string]$Region = 'taiwan')
  $d = Join-Path $TMP $Name
  if (Test-Path (Join-Path $d 'fonts')) { & node -e "try{require('fs').rmdirSync(process.argv[1])}catch{}" (Join-Path $d 'fonts') }
  if (Test-Path $d) { Remove-Item -Recurse -Force $d }
  & node (Join-Path $SK 'scripts/new_film.mjs') $d --region $Region 2>&1 | Out-Null
  return $d
}

function RunPreflight {
  param([string]$Dir, [string]$Stage = 'draft')
  $out = & node (Join-Path $SK 'scripts/preflight.mjs') --dir $Dir --stage $Stage --json 2>&1 | Out-String
  $code = $LASTEXITCODE
  $j = $null
  try { $j = $output = $out | ConvertFrom-Json } catch {}
  return @{ code = $code; json = $j; raw = $out }
}

$results = @()
function Assert {
  param([string]$Name, [bool]$Pass, [string]$Detail = '')
  $script:results += [pscustomobject]@{ name = $Name; pass = $Pass; detail = $Detail }
  $mark = if ($Pass) { 'PASS' } else { 'FAIL' }
  Write-Host ("  [{0}] {1} {2}" -f $mark, $Name, $Detail)
}

New-Item -ItemType Directory -Force $TMP | Out-Null
Write-Host "预检回归（$TMP）`n"

# ---------- 1. 干净的 TW 片子：不应有 blocking ----------
Write-Host '1. 干净的台湾片子'
$d = NewFixture 'tw-clean'
$r = RunPreflight $d
$blocking = @($r.json.blocking_errors).Count
Assert '干净片子没有 blocking' ($blocking -eq 0) "(blocking=$blocking, exit=$($r.code))"

# ---------- 2. local-clash 两人父层 opacity:0（真的复现旧 bug，不是靠参数报错） ----------
Write-Host '2. local-clash 父层 opacity:0'
$d = NewFixture 'clash-opacity'
# 用一套合法的 local-clash 镜头表（参数都对），但把 lib 里的 slam 改坏：进度恒为 0
$v = Join-Path $TMP 'clash-src'
$film = @'
window.ready=(async()=>{
 const F=await FB.init({counts:['assets/clips/counts.json'],cuts:[],fonts:KIT.FONTS});
 const K=await KIT.use(F);
 await K.film([
  {scene:'local-clash', says:'两个人对撞，但父层透明',
   left:{line:'甲說', name:'甲'}, right:{line:'乙說', name:'乙'},
   clash:'誰對？', at:['@b01','@b02']},
 ]);
 return K.go();
})();
'@
$film | Set-Content (Join-Path $d 'film.js') -Encoding utf8NoBOM
# 模拟旧 bug：把 slam 的进度算成 0（opacity 永远 0）
$ln = Join-Path $d 'lib/local_native.js'
$src = Get-Content $ln -Raw
$src = $src -replace "function slam\(t,t0,o=\{\}\)\{", "function slam(t,t0,o={}){ return {sc:1,o:0,dy:0};  /* 故意坏掉：进度恒 0 */"
$src | Set-Content $ln -Encoding utf8NoBOM
$r = RunPreflight $d
$codes = @($r.json.blocking_errors | ForEach-Object { $_.code })
Assert '合法 local-clash 但父层 opacity=0 被拦' ($codes -contains 'clash_people_missing') "(codes=$($codes -join ','))"

# ---------- 3. 晚 cue：drawAt 指向一句**存在但不在本镜里**的 cue ----------
Write-Host '3. cue 落在镜外'
$d = NewFixture 'late-cue'
& node (Join-Path $SK 'scripts/timeline_stub.mjs') (Join-Path $d 'script.json') --force 2>&1 | Out-Null
# 第 1 镜到 @b02 结束；drawAt 指向 @b04 里真实存在的词（句子存在、cue 能解析，但属于后面的镜头）
$film = Join-Path $d 'film.js'
$src = Get-Content $film -Raw
$src = $src -replace "headline:'一句話洗版？', sub:'政見呢？',", "headline:'一句話洗版？', sub:'政見呢？', drawAt:'@b03:聽起來',"
$src | Set-Content $film -Encoding utf8NoBOM
$r = RunPreflight $d
$codes = @($r.json.blocking_errors | ForEach-Object { $_.code })
Assert 'drawAt 超出镜尾被拦' ($codes -contains 'cue_outside_shot') "(codes=$($codes -join ','))"

# ---------- 4. 尾段空档：最后一镜不覆盖到片尾 ----------
Write-Host '4. 尾段空档'
$d = NewFixture 'tail-gap'
& node (Join-Path $SK 'scripts/timeline_stub.mjs') (Join-Path $d 'script.json') --force 2>&1 | Out-Null
# 直接删掉最后一个镜头，页面就会在片尾留下空档
$film = Join-Path $d 'film.js'
$src = Get-Content $film -Raw
$src = $src -replace "(?s)\s*\{scene:'local-quote-card'.*?\}\s*,\s*\]\);", "
]);"
$src | Set-Content $film -Encoding utf8NoBOM
$r = RunPreflight $d
$codes = @($r.json.blocking_errors | ForEach-Object { $_.code })
Assert '最后一镜没铺到片尾被拦' ($codes -contains 'tail_gap') "(codes=$($codes -join ','))"

# ---------- 5. 文案改了没重跑时间线 ----------
Write-Host '5. 文案改了但时间线是旧的'
$d = NewFixture 'stale-timeline'
& node (Join-Path $SK 'scripts/timeline_stub.mjs') (Join-Path $d 'script.json') --force 2>&1 | Out-Null
$sp = Join-Path $d 'script.json'
$s = Get-Content $sp -Raw | ConvertFrom-Json
$s.lines[0].text = $s.lines[0].text + '（改过）'
$s | ConvertTo-Json -Depth 6 | Set-Content $sp -Encoding utf8NoBOM
$r = RunPreflight $d
$codes = @($r.json.blocking_errors | ForEach-Object { $_.code })
Assert '文案变了不重算时间线被拦' ($codes -contains 'stale_timeline') "(codes=$($codes -join ','))"

# ---------- 6. 地区与音色错配 ----------
Write-Host '6. 香港片用了台湾音色'
$d = NewFixture 'locale-mismatch' 'hongkong'
$sp = Join-Path $d 'script.json'
# 直接按文本改，保证 region 真的写进去（ConvertFrom-Json/ConvertTo-Json 会丢属性大小写）
$raw = Get-Content $sp -Raw
$raw = $raw -replace '"voice"\s*:\s*"[^"]*"', '"region": "hongkong",
  "voice": "zh-TW-HsiaoChenNeural"'
$raw | Set-Content $sp -Encoding utf8NoBOM
& node (Join-Path $SK 'scripts/timeline_stub.mjs') $sp --force 2>&1 | Out-Null
$r = RunPreflight $d
$codes = @($r.json.blocking_errors | ForEach-Object { $_.code })
Assert '香港用台湾音色被拦' ($codes -contains 'locale_voice_mismatch') "(codes=$($codes -join ','))"

# ---------- 7. overlays:none 但页面还有角标 ----------
Write-Host '7. 声称无角标但角标还在'
$d = NewFixture 'badge-leak'
$film = Join-Path $d 'film.js'
$src = Get-Content $film -Raw
$src = $src -replace "K\.politics\.display\('no-badges'\);", "K.politics.display('full');`n K.politics.badges([{from:'@b01', source:'測試來源', nature:'fact'}]);"
$src | Set-Content $film -Encoding utf8NoBOM
$ed = Join-Path $d 'editorial.json'
$e = Get-Content $ed -Raw | ConvertFrom-Json
$e.config | Add-Member -NotePropertyName overlays -NotePropertyValue 'none' -Force
$e | ConvertTo-Json -Depth 8 | Set-Content $ed -Encoding utf8NoBOM
$r = RunPreflight $d
$codes = @($r.json.blocking_errors | ForEach-Object { $_.code })
Assert 'overlays:none 但角标还在被拦' ($codes -contains 'badge_visible') "(codes=$($codes -join ','))"

# ---------- 8. 坏 JSON ----------
Write-Host '8. script.json 不是合法 JSON'
$d = NewFixture 'bad-json'
'{ this is not json' | Set-Content (Join-Path $d 'script.json') -Encoding utf8NoBOM
$r = RunPreflight $d
$codes = @($r.json.blocking_errors | ForEach-Object { $_.code })
Assert '坏 JSON 被诊断而不是崩溃' ($codes -contains 'script_bad_json') "(codes=$($codes -join ','))"

# ---------- 9. review.json 的 hash 对不上 ----------
Write-Host '9. 复核记录是旧版的'
$d = NewFixture 'review-stale'
& node (Join-Path $SK 'scripts/timeline_stub.mjs') (Join-Path $d 'script.json') --force 2>&1 | Out-Null
New-Item -ItemType Directory -Force (Join-Path $d 'out') | Out-Null
'{ "input_hash": "deadbeef", "covers": { "visual_check": ["看过"], "semantic_check": ["看过"] } }' |
  Set-Content (Join-Path $d 'out/review.json') -Encoding utf8NoBOM
$r = RunPreflight $d 'draft'
$rev = @($r.json.review_required | ForEach-Object { $_.code })
Assert 'hash 对不上时报 review_stale' ($rev -contains 'review_stale') "(review=$($rev -join ','))"

# ---------- 10. covers 是空的，不能消项 ----------
Write-Host '10. covers 写了但证据为空'
$d = NewFixture 'review-empty'
& node (Join-Path $SK 'scripts/timeline_stub.mjs') (Join-Path $d 'script.json') --force 2>&1 | Out-Null
New-Item -ItemType Directory -Force (Join-Path $d 'out') | Out-Null
$r0 = RunPreflight $d 'draft'
$hash = $r0.json.evidence.input_hash
("{ ""input_hash"": ""$hash"", ""covers"": { ""visual_check"": [], ""semantic_check"": [""""] } }") |
  Set-Content (Join-Path $d 'out/review.json') -Encoding utf8NoBOM
$r = RunPreflight $d 'draft'
$rev = @($r.json.review_required | ForEach-Object { $_.code })
$warn = @($r.json.warnings | ForEach-Object { $_.code })
Assert '空证据不能消掉复核项' (($rev -contains 'visual_check') -and ($warn -contains 'review_empty_evidence')) "(review=$($rev -join ','))"

# ---------- 汇总 ----------
Write-Host ''
$pass = @($results | Where-Object pass).Count
$fail = @($results | Where-Object { -not $_.pass }).Count
Write-Host "通过 $pass / 失败 $fail"
if ($fail) { exit 1 } else { exit 0 }





