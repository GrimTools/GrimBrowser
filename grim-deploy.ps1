# ============================================================
#   GRIM DEPLOY CONSOLE  ::  reaper-grade deployment
# ============================================================

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Root    = $PSScriptRoot
$RepoUrl = 'https://github.com/GrimTools/GrimBrowser.git'
$WebDir  = Join-Path $Root 'website'
$DistDir = Join-Path $Root 'dist'

# ---- Password (sha256 of "2014") -------------------------------------------
$SecretHash = '96da37e95d5cc34fe3bef6c89428df859b8a217630d0c664da1daf1539caacf5'
function Get-Hash([string]$s){
  $sha=[System.Security.Cryptography.SHA256]::Create()
  -join ($sha.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($s))|%{$_.ToString('x2')})
}

# ---- Theme (mono + toxic green hacker accents) -----------------------------
$Bone='White'; $Ash='DarkGray'; $Grey='Gray'; $Red='Red'; $Grn='Green'; $Acid='DarkGreen'
function Line($t,$c=$Grey){ Write-Host $t -ForegroundColor $c }
function Bad($t){ Write-Host "  [x] $t" -ForegroundColor $Red }
function Ok($t){ Write-Host "  [+] $t" -ForegroundColor $Grn }
function Slow($t,$c=$Grn,$d=8){ foreach($ch in $t.ToCharArray()){ Write-Host $ch -NoNewline -ForegroundColor $c; Start-Sleep -Milliseconds $d }; Write-Host "" }

# ---- pure larp: fake "hacking" flavor (does nothing real, looks tuff) -------
$Glyphs = '01!<>/\|=+*#%$&@ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜ'.ToCharArray()

# cmatrix-style falling rain — bright heads, dim tails, runs for a few seconds
function Matrix($seconds=2.5){
  $w = [Console]::WindowWidth - 2
  $h = [Math]::Min([Console]::WindowHeight - 2, 26)
  if($w -lt 10 -or $h -lt 5){ return }   # window too tiny, skip the show
  $rnd = New-Object Random
  $heads = @{}
  Clear-Host
  try{ [Console]::CursorVisible = $false }catch{}
  $sw = [Diagnostics.Stopwatch]::StartNew()
  while($sw.Elapsed.TotalSeconds -lt $seconds){
    # spawn a few new streams each frame
    1..3 | %{ $heads[$rnd.Next(0,$w)] = 0 } | Out-Null
    foreach($c in @($heads.Keys)){
      $y = $heads[$c]
      if($y -lt $h){
        [Console]::SetCursorPosition($c,$y)
        Write-Host $Glyphs[$rnd.Next($Glyphs.Length)] -NoNewline -ForegroundColor Green
        if($y -gt 0){
          [Console]::SetCursorPosition($c,$y-1)
          Write-Host $Glyphs[$rnd.Next($Glyphs.Length)] -NoNewline -ForegroundColor DarkGreen
        }
      }
      $tail = $y - 7
      if($tail -ge 0 -and $tail -lt $h){ [Console]::SetCursorPosition($c,$tail); Write-Host ' ' -NoNewline }
      $heads[$c] = $y + 1
      if(($y - 7) -ge $h){ $heads.Remove($c) | Out-Null }
    }
    Start-Sleep -Milliseconds 45
  }
  try{ [Console]::CursorVisible = $true }catch{}
  Clear-Host
}

# animated fake progress bar
function Bar($label){
  $w=28
  Write-Host ("  {0,-26}" -f $label) -NoNewline -ForegroundColor $Ash
  Write-Host "[" -NoNewline -ForegroundColor $Grey
  for($i=0;$i -lt $w;$i++){ Write-Host "#" -NoNewline -ForegroundColor $Grn; Start-Sleep -Milliseconds (Get-Random -Min 6 -Max 40) }
  Write-Host "] " -NoNewline -ForegroundColor $Grey
  Write-Host "100%" -ForegroundColor $Grn
}

# timestamped log line, reads like a real console
function Stamp { Get-Date -Format 'HH:mm:ss' }
function Log($t,$c=$Grn){ Write-Host ("  [{0}] " -f (Stamp)) -NoNewline -ForegroundColor $Ash; Write-Host $t -ForegroundColor $c }

# a titled banner so each task is clearly separated / readable
function Head($title){
  Clear-Host
  Write-Host $Rule -ForegroundColor $Acid
  Write-Host ("   >> {0}" -f $title) -ForegroundColor $Grn
  Write-Host $Rule -ForegroundColor $Acid
  Write-Host ""
}

# coherent fake "hacking" log for each task (pure flavor, does nothing real)
function Larp($mode){
  $steps = switch($mode){
    'git'   { @('opening secure channel to remote','verifying reaper signature','staging changed objects','deflating deltas') }
    'build' { @('resolving native dependencies','packaging electron runtime','signing binary with reaper cert','sealing update manifest') }
    'web'   { @('connecting to edge network','purging stale cache nodes','uploading assets to CDN','warming global endpoints') }
    default { @('initializing','handshaking','syncing') }
  }
  foreach($s in $steps){ Log ("{0} ... ok" -f $s) $Acid; Start-Sleep -Milliseconds 110 }
  Write-Host ""
}

$Reaper = @'
⠀⠀⠀⠀⠀⢸⠓⢄⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⢸⠀⠀⠑⢤⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⢸⡆⠀⠀⠀⠙⢤⡷⣤⣦⣀⠤⠖⠚⡿⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀
⣠⡿⠢⢄⡀⠀⡇⠀⠀⠀⠀⠀⠉⠀⠀⠀⠀⠀⠸⠷⣶⠂⠀⠀⠀⣀⣀⠀⠀⠀
⢸⣃⠀⠀⠉⠳⣷⠞⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠉⠉⠉⠉⠉⠉⠉⢉⡭⠋
⠀⠘⣆⠀⠀⠀⠁⠀⢀⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡴⠋⠀⠀
⠀⠀⠘⣦⠆⠀⠀⢀⡎⢹⡀⠀⠀⠀⠀⠀⠀⠀⠀⡀⠀⠀⡀⣠⠔⠋⠀⠀⠀⠀
⠀⠀⠀⡏⠀⠀⣆⠘⣄⠸⢧⠀⠀⠀⠀⢀⣠⠖⢻⠀⠀⠀⣿⢥⣄⣀⣀⣀⠀⠀
⠀⠀⢸⠁⠀⠀⡏⢣⣌⠙⠚⠀⠀⠠⣖⡛⠀⣠⠏⠀⠀⠀⠇⠀⠀⠀⠀⢙⣣⠄
⠀⠀⢸⡀⠀⠀⠳⡞⠈⢻⠶⠤⣄⣀⣈⣉⣉⣡⡔⠀⠀⢀⠀⠀⣀⡤⠖⠚⠀⠀
⠀⠀⡼⣇⠀⠀⠀⠙⠦⣞⡀⠀⢀⡏⠀⢸⣣⠞⠀⠀⠀⡼⠚⠋⠁⠀⠀⠀⠀⠀
⠀⢰⡇⠙⠀⠀⠀⠀⠀⠀⠉⠙⠚⠒⠚⠉⠀⠀⠀⠀⡼⠁⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⢧⡀⠀⢠⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⣞⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠙⣶⣶⣿⠢⣄⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠉⠀⠀⠀⠙⢿⣳⠞⠳⡄⠀⠀⠀⢀⡞⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠀⠀⠹⣄⣀⡤⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
'@

$Rule = "══════════════════════════════════════════════════════"

function Boot {
  Clear-Host
  Matrix 2.5
  Write-Host ""
  Slow "  [ booting grim deploy console v1.0 ]" $Acid 4
  Slow "  > mounting reaper.core .............. OK" $Grn 2
  Slow "  > loading payload modules ........... OK" $Grn 2
  Slow "  > spinning up ghost protocol ........ OK" $Grn 2
  Slow "  > handshake w/ grimbrowser.net ...... OK" $Grn 2
  Bar "establishing secure tunnel"
  Slow "  [ ENCRYPTED CONNECTION ESTABLISHED ]" $Grn 4
  Start-Sleep -Milliseconds 300
}

function Show-Menu {
  Clear-Host
  Write-Host $Reaper -ForegroundColor $Bone
  Write-Host $Rule -ForegroundColor $Acid
  Write-Host "   G R I M   D E P L O Y   ::   " -NoNewline -ForegroundColor $Grn
  Write-Host "root@reaper" -ForegroundColor $Ash
  Write-Host $Rule -ForegroundColor $Acid
  Write-Host "   [1]  push source        -> github repo"      -ForegroundColor $Grey
  Write-Host "   [2]  build installer    -> ship to website"  -ForegroundColor $Grey
  Write-Host "   [3]  deploy website     -> go live"          -ForegroundColor $Grey
  Write-Host "   [4]  FULL SEND          -> all of the above" -ForegroundColor $Grn
  Write-Host "   [Q]  jack out"                               -ForegroundColor $Ash
  Write-Host $Rule -ForegroundColor $Acid
  # fake status line — pure larp
  $sid = -join (1..8 | %{ '{0:X}' -f (Get-Random -Max 16) })
  $ip  = "10.66.$(Get-Random -Max 255).$(Get-Random -Max 255)"
  $ping = Get-Random -Min 11 -Max 88
  Write-Host ("   session:{0}  node:{1}  ping:{2}ms  " -f $sid,$ip,$ping) -NoNewline -ForegroundColor $Acid
  Write-Host "[SECURE]" -ForegroundColor $Grn
  Write-Host ""
}

function Require-Password {
  for($i=0;$i -lt 3;$i++){
    $pw=Read-Host "   [auth] password" -AsSecureString
    $plain=[Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($pw))
    if((Get-Hash $plain) -eq $SecretHash){ Slow "  [+] ACCESS GRANTED" $Grn 6; return $true }
    Bad "ACCESS DENIED ($([int](2-$i)) attempts left)"
  }
  return $false
}

# ---- Actions ----------------------------------------------------------------
function Update-GitHub {
  Head "PUSH SOURCE  ->  GITHUB"
  Larp 'git'
  Set-Location $Root
  if(-not (Test-Path (Join-Path $Root '.git'))){
    Log "first run: linking folder to remote" $Grn
    git init | Out-Null; git branch -M main; git remote add origin $RepoUrl
  }
  git add -A
  Write-Host ""
  $stamp=Get-Date -Format 'yyyy-MM-dd HH:mm'
  $msg=Read-Host "   describe what changed (blank = 'update $stamp')"
  if([string]::IsNullOrWhiteSpace($msg)){ $msg="update $stamp" }
  Write-Host ""
  try{ git commit -m $msg | Out-Null; Log "snapshot committed: $msg" $Grn }catch{ Log "nothing changed since last push" $Ash }
  Log "uploading to github (may pause on first-run browser sign-in)..." $Grn
  git push -u origin main
  if($LASTEXITCODE -ne 0){
    Log "remote had an older copy -> overwriting with your files" $Grn
    git push -u origin main --force
  }
  Write-Host ""
  if($LASTEXITCODE -eq 0){ Ok "GITHUB SYNCED  ->  $RepoUrl" }
  else{ Bad "push failed - read the git lines above" }
}

function Update-App {
  Head "BUILD INSTALLER  ->  SHIP TO WEBSITE"
  Larp 'build'
  Set-Location $Root
  # auto-bump the patch version so every build is a new number -> auto-updater always fires
  $pkgPath = Join-Path $Root 'package.json'
  $pkg = Get-Content -Raw $pkgPath
  if($pkg -match '"version":\s*"(\d+)\.(\d+)\.(\d+)"'){
    $newVer = "$($Matches[1]).$($Matches[2]).$([int]$Matches[3] + 1)"
    $pkg = $pkg -replace '("version":\s*")\d+\.\d+\.\d+(")', "`${1}$newVer`${2}"
    [IO.File]::WriteAllText($pkgPath, $pkg)
    Log "version bumped -> $newVer  (users on the old version will auto-update to this)" $Grn
  } else { Log "could not read version from package.json - building anyway" $Ash }
  Write-Host ""
  Log "compiling the installer - this takes a few minutes, let it run..." $Grn
  Write-Host ""
  npm run dist
  Write-Host ""
  if(-not (Test-Path $WebDir)){ Bad "no website folder."; return }
  # ship the installer + auto-update feed files into the website so users pull from the site
  $shipped=0
  Get-ChildItem $DistDir -Filter *.exe -ErrorAction SilentlyContinue | %{ Copy-Item $_.FullName $WebDir -Force; Log ("shipped {0}" -f $_.Name) $Acid; $shipped++ }
  foreach($f in @('latest.yml')){
    $p=Join-Path $DistDir $f; if(Test-Path $p){ Copy-Item $p $WebDir -Force; Log "shipped update manifest (latest.yml)" $Acid }
  }
  Get-ChildItem $DistDir -Filter *.blockmap -ErrorAction SilentlyContinue | %{ Copy-Item $_.FullName $WebDir -Force }
  Write-Host ""
  if($shipped -gt 0){ Ok "INSTALLER + AUTO-UPDATE FEED SHIPPED  ->  website/" }
  else{ Bad "build produced no .exe (read the build log above)" }
}

function Update-Website {
  Head "DEPLOY WEBSITE  ->  GO LIVE"
  Larp 'web'
  Set-Location $Root
  if(-not (Test-Path $WebDir)){ Bad "no website folder."; return }
  Log "pushing website to netlify (first run asks a one-time sign-in)..." $Grn
  Write-Host ""
  # prefer the locally-installed netlify (instant); fall back to npx if missing
  $local = Join-Path $Root 'node_modules\.bin\netlify.cmd'
  if(Test-Path $local){ & $local deploy --prod --dir "$WebDir" }
  else{ npx --yes netlify-cli deploy --prod --dir "$WebDir" }
  Write-Host ""
  if($LASTEXITCODE -eq 0){ Ok "WEBSITE LIVE  ->  https://grimbrowser.netlify.app" }
  else{ Bad "deploy failed - read the netlify lines above" }
}

# ---- Loop -------------------------------------------------------------------
Boot
while($true){
  Show-Menu
  $sel=(Read-Host '   $').ToUpper()
  if($sel -eq 'Q'){ Slow "  ...severing connection. the reaper fades." $Ash 6; exit }
  if($sel -notin @('1','2','3','4')){ Bad "unknown command"; Start-Sleep 1; continue }
  Write-Host ""
  if(-not (Require-Password)){ Bad "locked out. rerouting to menu."; Start-Sleep 1; continue }
  try{
    switch($sel){
      '1'{ Update-GitHub }
      '2'{ Update-App }
      '3'{ Update-Website }
      '4'{ Update-GitHub; Update-App; Update-Website }
    }
  }catch{ Bad $_.Exception.Message }
  Write-Host ""; Read-Host "   [enter] to return to console" | Out-Null
}
