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
function Larp {
  $hex = -join (1..24 | %{ '{0:X2}' -f (Get-Random -Max 256) })
  $lines = @(
    "  > spoofing MAC address ............ $hex",
    "  > rerouting through 7 proxies ..... [OK]",
    "  > bypassing ICE / firewall ........ [OK]",
    "  > decrypting reaper keyring ....... 100%",
    "  > injecting payload ............... [OK]"
  )
  foreach($l in ($lines | Get-Random -Count 3)){ Write-Host $l -ForegroundColor $Acid; Start-Sleep -Milliseconds 120 }
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
  Write-Host ""
  Slow "  [ booting grim deploy console v1.0 ]" $Acid 4
  Slow "  > mounting reaper.core .............. OK" $Grn 2
  Slow "  > loading payload modules ........... OK" $Grn 2
  Slow "  > handshake w/ grimbrowser.net ...... OK" $Grn 2
  Start-Sleep -Milliseconds 250
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
  Write-Host ""; Line ">> injecting source into repo..." $Grn
  Larp
  Set-Location $Root
  if(-not (Test-Path (Join-Path $Root '.git'))){
    Line "   [first run] linking -> $RepoUrl" $Ash
    git init | Out-Null; git branch -M main; git remote add origin $RepoUrl
  }
  git add -A
  $stamp=Get-Date -Format 'yyyy-MM-dd HH:mm'
  $msg=Read-Host "   commit msg (blank = 'update $stamp')"
  if([string]::IsNullOrWhiteSpace($msg)){ $msg="update $stamp" }
  try{ git commit -m $msg | Out-Null }catch{ Line "   (nothing changed)" $Ash }
  Line "   pushing... (one-time browser Authorize on first run)" $Ash
  git push -u origin main
  Ok "repo synced -> $RepoUrl"
}

function Update-App {
  Write-Host ""; Line ">> forging installer..." $Grn
  Larp
  Set-Location $Root
  npm run dist
  if(-not (Test-Path $WebDir)){ Bad "no website folder."; return }
  # ship the installer + auto-update feed files into the website so users pull from the site
  $shipped=0
  Get-ChildItem $DistDir -Filter *.exe -ErrorAction SilentlyContinue | %{ Copy-Item $_.FullName $WebDir -Force; $shipped++ }
  foreach($f in @('latest.yml')){
    $p=Join-Path $DistDir $f; if(Test-Path $p){ Copy-Item $p $WebDir -Force }
  }
  Get-ChildItem $DistDir -Filter *.blockmap -ErrorAction SilentlyContinue | %{ Copy-Item $_.FullName $WebDir -Force }
  if($shipped -gt 0){ Ok "installer + update feed shipped -> website/" }
  else{ Bad "build produced no .exe (check the log above)" }
}

function Update-Website {
  Write-Host ""; Line ">> deploying website to the grid..." $Grn
  Larp
  Set-Location $Root
  if(-not (Test-Path $WebDir)){ Bad "no website folder."; return }
  # prefer the locally-installed netlify (instant); fall back to npx if missing
  $local = Join-Path $Root 'node_modules\.bin\netlify.cmd'
  if(Test-Path $local){ & $local deploy --prod --dir "$WebDir" }
  else{ npx --yes netlify-cli deploy --prod --dir "$WebDir" }
  Ok "website live -> https://grimbrowser.netlify.app"
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
