param([Parameter(Mandatory = $true)][ValidateRange(1, 2147483647)][int]$RootPid)

# Toolhelp avoids WMI: validation must also be able to clean up when CIM hangs.
Add-Type -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
public static class P23ProcessSnapshot {
  [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)]
  public struct Entry {
    public uint size, usage, pid;
    public UIntPtr heap;
    public uint module, threads, parent;
    public int priority;
    public uint flags;
    [MarshalAs(UnmanagedType.ByValTStr, SizeConst=260)] public string exe;
  }
  [DllImport("kernel32.dll")] static extern IntPtr CreateToolhelp32Snapshot(uint flags, uint pid);
  [DllImport("kernel32.dll", CharSet=CharSet.Unicode)] static extern bool Process32FirstW(IntPtr snapshot, ref Entry e);
  [DllImport("kernel32.dll", CharSet=CharSet.Unicode)] static extern bool Process32NextW(IntPtr snapshot, ref Entry e);
  [DllImport("kernel32.dll")] static extern bool CloseHandle(IntPtr h);
  public static Dictionary<int,int> Parents() {
    var result = new Dictionary<int,int>();
    IntPtr h=CreateToolhelp32Snapshot(2,0);
    if (h==new IntPtr(-1)) throw new Exception("Cannot snapshot processes");
    try {
      Entry e=new Entry();e.size=(uint)Marshal.SizeOf(typeof(Entry));
      bool ok=Process32FirstW(h,ref e);
      while(ok) {result[(int)e.pid]=(int)e.parent;ok=Process32NextW(h,ref e);}
    } finally {CloseHandle(h);}
    return result;
  }
}
'@
$qaParents = [P23ProcessSnapshot]::Parents()
$qaTree = [System.Collections.Generic.List[int]]::new()
$qaTree.Add($RootPid)
for ($qaIndex = 0; $qaIndex -lt $qaTree.Count; $qaIndex++) {
  foreach ($qaPair in $qaParents.GetEnumerator()) {
    if ($qaPair.Value -eq $qaTree[$qaIndex] -and -not $qaTree.Contains($qaPair.Key)) {
      $qaTree.Add($qaPair.Key)
    }
  }
}
for ($qaIndex = $qaTree.Count - 1; $qaIndex -ge 0; $qaIndex--) {
  Stop-Process -Id $qaTree[$qaIndex] -ErrorAction SilentlyContinue
}
