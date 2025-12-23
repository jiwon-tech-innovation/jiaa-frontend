import sys
import time
import subprocess
import json

def get_running_processes():
    """Returns a set of (pid, name) tuples for currently running processes."""
    try:
        # ps -e: all processes
        # -o pid,comm: output only PID and command name
        output = subprocess.check_output(["ps", "-e", "-o", "pid,comm"], encoding='utf-8')
        processes = set()
        for line in output.strip().split('\n')[1:]: # Skip header
            parts = line.strip().split(maxsplit=1)
            if len(parts) == 2:
                pid, name = parts
                processes.add((pid, name))
        return processes
    except Exception as e:
        sys.stderr.write(f"Error getting processes: {e}\n")
        return set()

def main():
    sys.stderr.write("Starting process monitor...\n")
    sys.stderr.flush()
    
    # Initial snapshot
    seen_processes = get_running_processes()
    
    # Report initial processes too (so we can kill already running apps)
    for pid, name in seen_processes:
        if name == 'ps': continue
        event = {
            "event": "new_process",
            "pid": pid,
            "name": name
        }
        print(json.dumps(event))
        sys.stdout.flush()
    
    while True:
        try:
            time.sleep(1) # Check every 1 second
            
            current_processes = get_running_processes()
            new_processes = current_processes - seen_processes
            
            for pid, name in new_processes:
                # Filter out 'ps' itself to avoid noise
                if name == 'ps':
                    continue
                    
                event = {
                    "event": "new_process",
                    "pid": pid,
                    "name": name
                }
                print(json.dumps(event))
                sys.stdout.flush()
            
            seen_processes = current_processes
            
        except KeyboardInterrupt:
            break
        except Exception as e:
            sys.stderr.write(f"Monitor error: {e}\n")
            sys.stderr.flush()
            time.sleep(1)

if __name__ == "__main__":
    main()
