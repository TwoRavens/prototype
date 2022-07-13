import json

from sys import platform

with open('../.env.development', 'r') as f:
    content = f.readlines()

if platform == "darwin":
    content = [line.replace('127.0.0.1', 'host.docker.internal') for line in content]

params = [x.strip().split('=', 1) for x in content
          if x.strip() and not x.lstrip().startswith("#")]

with open('./.env-sam.json', 'w') as f:
    json.dump({"Parameters": dict(params)}, f, indent=4)

