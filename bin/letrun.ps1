#!/usr/bin/env pwsh

$exe=""
if ($PSVersionTable.PSVersion -lt "6.0" -or $IsWindows) {
  # Fix case when both the Windows and Linux builds of Node
  # are installed in the same directory
  $exe=".exe"
}
$ret=0
# Support pipeline input
if ($MyInvocation.ExpectingInput) {
  $input | & "node$exe"  "letrun.mjs" $args
} else {
  & "node$exe"  "letrun.mjs" $args
}
$ret=$LASTEXITCODE
exit $ret
