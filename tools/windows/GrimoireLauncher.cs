using System;
using System.Diagnostics;
using System.IO;
using System.Net.Sockets;
using System.Threading;
using System.Windows.Forms;

namespace Grimoire
{
    static class Program
    {
        private const int Port = 47920;

        private static bool IsPortOpen(string host, int port)
        {
            try
            {
                using (var client = new TcpClient())
                {
                    var result = client.BeginConnect(host, port, null, null);
                    bool success = result.AsyncWaitHandle.WaitOne(TimeSpan.FromMilliseconds(500));
                    if (!success) return false;
                    client.EndConnect(result);
                    return true;
                }
            }
            catch
            {
                return false;
            }
        }

        [STAThread]
        static void Main()
        {
            string baseDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd('\\', '/');
            string pyScript = Path.Combine(baseDir, "chronicles-vault", "tools", "windows", "run_grimoire_gui.py");
            if (!File.Exists(pyScript))
            {
                // Try alternate location inside repository
                pyScript = Path.Combine(baseDir, "tools", "windows", "run_grimoire_gui.py");
            }

            string pythonExe = "python.exe";
            string venvPy = Path.Combine(baseDir, "venv", "Scripts", "python.exe");
            if (File.Exists(venvPy))
            {
                pythonExe = venvPy;
            }

            try
            {
                ProcessStartInfo psi = new ProcessStartInfo
                {
                    FileName = pythonExe,
                    Arguments = "\"" + pyScript + "\"",
                    WorkingDirectory = baseDir,
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    WindowStyle = ProcessWindowStyle.Hidden
                };

                Process proc = Process.Start(psi);
                if (proc != null)
                {
                    proc.WaitForExit();
                    return;
                }
            }
            catch (Exception)
            {
                // Fallback: Launch standalone app mode
                string targetUrl = "http://127.0.0.1:" + Port + "/";
                try
                {
                    Process.Start("msedge.exe", "--app=" + targetUrl + " --window-size=1420,880");
                }
                catch
                {
                    Process.Start(targetUrl);
                }
            }
        }
    }
}
