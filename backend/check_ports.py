from pathlib import Path
import socket
import subprocess
import sys
import os
import traceback


def is_port_occupied(port):
    try:
        with socket.create_connection(("127.0.0.1", port), timeout=1):
            return True
    except ConnectionRefusedError:
        return False
    except socket.timeout:
        return True
    except OSError:
        return False
    except Exception:
        return True


def get_port_process_info(port):
    pid = None
    process_name = None
    try:
        if os.name == "nt":
            netstat = subprocess.run(["netstat", "-ano"], capture_output=True, text=True)
            for line in netstat.stdout.splitlines():
                line = line.strip()
                if not line:
                    continue
                if f":{port} " not in line and line.endswith(f":{port}") is False:
                    continue
                parts = line.split()
                if len(parts) < 5:
                    continue
                pid = parts[-1]
                break
            if pid:
                task = subprocess.run(["tasklist", "/fi", f"PID eq {pid}", "/fo", "csv", "/nh"], capture_output=True, text=True)
                output = task.stdout.strip()
                if output and '"' in output:
                    process_name = output.split(",")[0].strip('"')
                else:
                    process_name = output.strip()
    except Exception:
        pass
    return pid, process_name


def detect_uvicorn_on_port(port):
    try:
        with socket.create_connection(("127.0.0.1", port), timeout=1) as sock:
            request = b"GET / HTTP/1.1\r\nHost: 127.0.0.1\r\nConnection: close\r\n\r\n"
            sock.sendall(request)
            data = sock.recv(1024).decode(errors="ignore").lower()
            return "server: uvicorn" in data or "uvicorn" in data
    except Exception:
        return False


def main():
    port = 8000
    print("=== check_ports.py ===")
    occupied = is_port_occupied(port)
    print(f"Port {port} occupied: {occupied}")
    if occupied:
        pid, process_name = get_port_process_info(port)
        print(f"Process ID: {pid or '<unknown>'}")
        print(f"Process name: {process_name or '<unknown>'}")
        uvicorn_running = detect_uvicorn_on_port(port)
        print(f"uvicorn detected on port {port}: {uvicorn_running}")
        if uvicorn_running:
            print("DIAGNÓSTICO: Puerto 8000 ocupado por uvicorn o servicio HTTP activo")
            sys.exit(0)
        print("DIAGNÓSTICO: Puerto 8000 ocupado")
        sys.exit(1)
    print("DIAGNÓSTICO: Puerto 8000 libre")
    sys.exit(0)


if __name__ == "__main__":
    try:
        main()
    except Exception:
        print("DIAGNÓSTICO: Error inesperado al ejecutar check_ports.py")
        traceback.print_exc()
        sys.exit(1)
