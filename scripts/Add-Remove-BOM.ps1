param (
    [string]$filename = "",
	[switch]$nobom = $false,
	[switch]$addbom = $false
)

# Deal with cases where no directory is entered
if ($filename -eq "") {
    $filename = Read-Host "Enter the directory for processing: "
}
" "
ls -r -name $filename *.js
if ($nobom) {
    $input = Read-Host "`nAll the above files will have the BOM (if any) removed!`nProceed? (Y/N)"
} else {
    $input = Read-Host "`nAll the above files will have a BOM added (if necessary)!`nProceed? (Y/N)"
}
if ($input -eq "Y") {
    if ($nobom) {
        "Removing Byte Order Mark ..."
        ls -r $filename *.js | % { [System.IO.File]::WriteAllLines($_.FullName, ((Get-Content $_.FullName) -replace "^\xEF\xBB\xBF", ""))}
    } else {
        "Adding Byte Order Mark ..."
        ls -r $filename *.js | % {
            $document = Get-Content -encoding "UTF8" $_.FullName
            if ($document -match "^(?!\xEF\xBB\xBF)") { 
                $document | Set-Content -encoding "utf8BOM" $_.FullName 
            }
        }
    }
    "Done."
} else {
    "Operation cancelled!"
}

