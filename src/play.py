import json
import argparse
import urllib.parse
import os

PLAYER_URL = "https://dapaulid.github.io/life/web/player"

def play(config):
	url = PLAYER_URL + '?' + urllib.parse.urlencode(config)
	os.system('start chrome "--app=%s"' % url)
# end function



# Create the parser and add arguments
parser = argparse.ArgumentParser()
parser.add_argument(dest='filename', type=str, help="Input file")

# Parse and print the results
args = parser.parse_args()

with open(args.filename, 'r') as f:
	config = json.load(f)
play(config)

