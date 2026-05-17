param(
    [string]$Title = "Codex",
    [string]$Message = "Task complete.",
    [int]$DurationSeconds = 5
)

function ConvertTo-XmlEscapedText {
    param([string]$Text)
    return [System.Security.SecurityElement]::Escape($Text)
}

$toastShown = $false

try {
    [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
    [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null

    $escapedTitle = ConvertTo-XmlEscapedText $Title
    $escapedMessage = ConvertTo-XmlEscapedText $Message
    $toastXml = @"
<toast>
  <visual>
    <binding template="ToastGeneric">
      <text>$escapedTitle</text>
      <text>$escapedMessage</text>
    </binding>
  </visual>
</toast>
"@

    $xmlDocument = [Windows.Data.Xml.Dom.XmlDocument]::new()
    $xmlDocument.LoadXml($toastXml)
    $toast = [Windows.UI.Notifications.ToastNotification]::new($xmlDocument)
    $notifier = [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("Codex")
    $notifier.Show($toast)
    $toastShown = $true
} catch {
    $toastShown = $false
}

if (-not $toastShown) {
    try {
        Add-Type -AssemblyName System.Windows.Forms
        Add-Type -AssemblyName System.Drawing

        $notifyIcon = New-Object System.Windows.Forms.NotifyIcon
        $notifyIcon.Icon = [System.Drawing.SystemIcons]::Information
        $notifyIcon.BalloonTipIcon = [System.Windows.Forms.ToolTipIcon]::Info
        $notifyIcon.BalloonTipTitle = $Title
        $notifyIcon.BalloonTipText = $Message
        $notifyIcon.Visible = $true
        $notifyIcon.ShowBalloonTip([Math]::Max(1, $DurationSeconds) * 1000)
        Start-Sleep -Seconds ([Math]::Max(1, $DurationSeconds))
        $notifyIcon.Dispose()
    } catch {
        Write-Warning "Could not show Windows notification: $($_.Exception.Message)"
        [console]::beep(880, 250)
    }
}
