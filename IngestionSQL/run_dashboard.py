import os
import sys

# Patch agressif pour Python 3.14
os.environ['PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION'] = 'python'
sys.modules['google._upb._message'] = None

import streamlit.web.cli as stcli

if __name__ == "__main__":
    sys.argv = ["streamlit", "run", "dashboard.py"]
    sys.exit(stcli.main())
