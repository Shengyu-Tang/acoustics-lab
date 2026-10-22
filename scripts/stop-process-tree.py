"""Terminate only a supplied process and its descendants, without WMI or .NET."""
import ctypes
from ctypes import wintypes as w
import sys


class ProcessEntry(ctypes.Structure):
    _fields_ = [("size", w.DWORD), ("usage", w.DWORD), ("pid", w.DWORD),
                ("heap", ctypes.c_size_t), ("module", w.DWORD), ("threads", w.DWORD),
                ("parent", w.DWORD), ("priority", w.LONG), ("flags", w.DWORD),
                ("exe", w.WCHAR * 260)]


kernel = ctypes.WinDLL("kernel32", use_last_error=True)
kernel.CreateToolhelp32Snapshot.argtypes = [w.DWORD, w.DWORD]
kernel.CreateToolhelp32Snapshot.restype = w.HANDLE
kernel.Process32FirstW.argtypes = [w.HANDLE, ctypes.POINTER(ProcessEntry)]
kernel.Process32NextW.argtypes = [w.HANDLE, ctypes.POINTER(ProcessEntry)]
kernel.OpenProcess.argtypes = [w.DWORD, w.BOOL, w.DWORD]
kernel.OpenProcess.restype = w.HANDLE
kernel.TerminateProcess.argtypes = [w.HANDLE, w.UINT]
kernel.CloseHandle.argtypes = [w.HANDLE]


def processes():
    handle = kernel.CreateToolhelp32Snapshot(2, 0)
    if handle == ctypes.c_void_p(-1).value:
        raise ctypes.WinError(ctypes.get_last_error())
    result = []
    try:
        entry = ProcessEntry()
        entry.size = ctypes.sizeof(entry)
        ok = kernel.Process32FirstW(handle, ctypes.byref(entry))
        while ok:
            result.append((entry.pid, entry.parent, entry.exe))
            ok = kernel.Process32NextW(handle, ctypes.byref(entry))
    finally:
        kernel.CloseHandle(handle)
    return result


def stop_tree(root):
    if root <= 0 or root == kernel.GetCurrentProcessId():
        raise ValueError("A different positive process ID is required")
    entries = processes()
    tree = [root]
    for parent in tree:
        tree.extend(pid for pid, ppid, _ in entries if ppid == parent and pid not in tree)
    for pid in reversed(tree):
        handle = kernel.OpenProcess(1, False, pid)
        if handle:
            try:
                kernel.TerminateProcess(handle, 1)
            finally:
                kernel.CloseHandle(handle)


if __name__ == "__main__":
    stop_tree(int(sys.argv[1]))
