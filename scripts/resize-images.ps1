param(
  [Parameter(Mandatory=$false)][int]$MaxWidthPosts = 1200,
  [Parameter(Mandatory=$false)][int]$MaxWidthSlides = 1600
)

Add-Type -AssemblyName System.Drawing

function Resize-Image([string]$inPath, [int]$maxWidth) {
  try {
    if (!(Test-Path $inPath)) { return }
    $img = [System.Drawing.Image]::FromFile($inPath)
    try {
      if ($img.Width -le $maxWidth) { return }
      $ratio = [double]$img.Height / [double]$img.Width
      $newWidth = [int]$maxWidth
      $newHeight = [int]([double]$newWidth * $ratio)

      $bmp = New-Object System.Drawing.Bitmap $newWidth, $newHeight
      $gr = [System.Drawing.Graphics]::FromImage($bmp)
      $gr.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
      $gr.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $gr.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
      $gr.DrawImage($img, 0, 0, $newWidth, $newHeight)

      $ext = [System.IO.Path]::GetExtension($inPath).ToLower()
      if ($ext -eq '.jpg' -or $ext -eq '.jpeg') {
        $encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
        $encParams = New-Object System.Drawing.Imaging.EncoderParameters 1
        $quality = [System.Drawing.Imaging.Encoder]::Quality
        $encParam = New-Object System.Drawing.Imaging.EncoderParameter $quality, 85L
        $encParams.Param[0] = $encParam
        $bmp.Save($inPath, $encoder, $encParams)
      }
      elseif ($ext -eq '.png') {
        $bmp.Save($inPath, [System.Drawing.Imaging.ImageFormat]::Png)
      }
      else {
        $bmp.Save($inPath)
      }
    }
    finally {
      $img.Dispose()
      if ($gr) { $gr.Dispose() }
      if ($bmp) { $bmp.Dispose() }
    }
  }
  catch {
    Write-Host "Resize failed for $inPath : $_"
  }
}

# Resize post images
Get-ChildItem -Recurse -Path "images/posts" -Include *.jpg,*.jpeg,*.png -File | ForEach-Object {
  Resize-Image -inPath $_.FullName -maxWidth $MaxWidthPosts
}

# Resize slider images
Get-ChildItem -Path "images" -Include slide*.jpg,slide*.jpeg,slide*.png -File | ForEach-Object {
  Resize-Image -inPath $_.FullName -maxWidth $MaxWidthSlides
}

