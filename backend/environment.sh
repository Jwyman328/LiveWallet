# Check if the virtual environment directory exists
if [ ! -d "venv" ]; then
  echo "Creating virtual environment..."
  pyenv virtualenv 3.10.1 venv
else
  echo "Virtual environment already exists."
fi

source venv/bin/activate
pip install -r requirements.txt

export VIRTUAL_ENV="./venv" # This previously was working as ./venv but in linux I had to do ~/.pyenv/versions/venv
export FLASK_APP="./src/app.py"
export RECEIVE_ADDRESS="bcrt1qkmvk2nadgplmd57ztld8nf8v2yxkzmdvwtjf8s"
export WALLET_DESCRIPTOR="wpkh(tprv8ZgxMBicQKsPcx5nBGsR63Pe8KnRUqmbJNENAfGftF3yuXoMMoVJJcYeUw5eVkm9WBPjWYt6HMWYJNesB5HaNVBaFc1M6dRjWSYnmewUMYy/84h/0h/0h/0/*)"
export PYTHONPATH="$PYTHONPATH:$PWD"


