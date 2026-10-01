const input       = document.getElementById('nameInput');
const btn         = document.getElementById('fetchBtn');
const light       = document.getElementById('light');
const statusText  = document.getElementById('statusText');
const img         = document.getElementById('pokemonImg');
const ballWrap    = document.getElementById('pokeballWrap');
const flash       = document.getElementById('flash');
const idTag       = document.getElementById('idTag');
const badge       = document.getElementById('caughtBadge');

function setLight(state){
  light.className = 'light ' + state; // ready | loading | error
}

function resetScreen(){
  img.classList.add('hidden');
  img.classList.remove('revealed');
  idTag.classList.add('hidden');
  badge.classList.remove('show');
  ballWrap.className = 'pokeball-wrap hidden';
  ballWrap.style.removeProperty('bottom');
}

function wait(ms){ return new Promise(r => setTimeout(r, ms)); }

async function catchSequence(){
  const name = input.value.trim().toLowerCase();
  if(!name){
    setLight('error');
    statusText.textContent = 'Type a Pokémon name first!';
    return;
  }

  btn.disabled = true;
  setLight('loading');
  resetScreen();
  statusText.textContent = 'Searching the tall grass...';

  let data;
  try{
    let res;
    try{
      res = await fetch('https://pokeapi.co/api/v2/pokemon/' + encodeURIComponent(name));
    }catch(networkErr){
      throw new Error('Could not reach PokéAPI (network/CORS blocked). Open this file directly in a browser tab, not inside a sandboxed preview, and check your internet connection.');
    }

    if(res.status === 404){
      throw new Error('No Pokémon named "' + name + '" was found. Check the spelling.');
    }
    if(!res.ok){
      throw new Error('PokéAPI returned an error (status ' + res.status + ').');
    }
    data = await res.json();
  }catch(err){
    console.error('Poké-Fetch error:', err);
    setLight('error');
    statusText.textContent = err.message;
    btn.disabled = false;
    return;
  }

  try{
    const sprite =
      (data.sprites && data.sprites.other && data.sprites.other['official-artwork'] && data.sprites.other['official-artwork'].front_default) ||
      (data.sprites && data.sprites.front_default);

    if(!sprite){
      setLight('error');
      statusText.textContent = 'Found it, but no image is available.';
      btn.disabled = false;
      return;
    }

    const niceName = data.name.charAt(0).toUpperCase() + data.name.slice(1);
    const dexNum = '#' + String(data.id).padStart(3, '0');

    img.src = sprite;
    img.alt = niceName;
    img.classList.remove('hidden');
    idTag.textContent = dexNum;

    statusText.textContent = 'A wild ' + niceName + ' appeared!';

    await wait(400);

    ballWrap.classList.remove('hidden');
    ballWrap.classList.add('throwing');

    await wait(680);

    ballWrap.classList.remove('throwing');
    ballWrap.classList.add('shaking');
    statusText.textContent = '...';

    await wait(1150);

    flash.classList.add('fire');
    img.classList.add('revealed');
    idTag.classList.remove('hidden');

    await wait(250);

    ballWrap.classList.add('vanish');

    await wait(400);

    flash.classList.remove('fire');
    setLight('ready');
    statusText.textContent = 'Gotcha!';
    badge.textContent = '✓ Caught — ' + dexNum + ' ' + niceName;
    badge.classList.add('show');
  }catch(animErr){
    console.error('Poké-Fetch animation error:', animErr);
    setLight('error');
    statusText.textContent = 'Something went wrong showing the result: ' + animErr.message;
  }finally{
    btn.disabled = false;
  }
}

btn.addEventListener('click', catchSequence);
input.addEventListener('keydown', e => {
  if(e.key === 'Enter') catchSequence();
});
