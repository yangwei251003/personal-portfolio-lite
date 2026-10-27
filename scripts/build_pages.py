"""Package the exact public runtime files, without local audit or private input."""
from pathlib import Path
import argparse,shutil
root=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--out',type=Path,default=Path('_site'));a=p.parse_args();out=a.out.resolve()
if out.exists() and any(out.iterdir()):p.error('Refusing to overwrite a nonempty output directory')
out.mkdir(parents=True,exist_ok=True)
for name in ['index.html','style.css','script.js','assets/avatar.png','assets/hero.png','variants/early-inline/index.html','variants/early-inline/cwv-report.html','variants/early-inline/LICENSE']:
 target=out/name;target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(root/name,target)
(out/'.nojekyll').touch();print('Built dependency-free public portfolio')
