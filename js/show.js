const dice = document.getElementById('dice');
const winnerBox = document.getElementById('winnerBox');
const bigCodeEl = document.getElementById('bigCode');
const fullNameEl = document.getElementById('fullName');
const departmentEl = document.getElementById('department');
const companyEl = document.getElementById('company');
const prizeNameEl = document.getElementById('prizeName');

let lastWinnerId = null;
let busy = false;

function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }
function startDice(){ dice.classList.add('spinning'); }
function stopDice(){ dice.classList.remove('spinning'); }

function setWinnerHidden(){
    winnerBox.classList.add('hidden');
    winnerBox.classList.remove('pop');
}
function revealWinner(row){
    prizeNameEl.textContent = row.prize_name || '';
    bigCodeEl.textContent = row.code || '----';
    fullNameEl.textContent = row.full_name || '—';
    departmentEl.textContent = row.department || '—';
    companyEl.textContent = row.company || '—';

    winnerBox.classList.remove('hidden');
    winnerBox.classList.remove('pop');
    void winnerBox.offsetWidth;
    winnerBox.classList.add('pop');
}

async function fetchLatest(){
    const res = await fetch(window.__API.latest, { cache:'no-store' });
    const json = await res.json();
    return json.ok ? json.data : null;
}

async function playSequence(row){
    busy = true;
    setWinnerHidden();

    startDice();
    await sleep(2200);           // thời gian lắc
    stopDice();

    await fireworksShow();       // hàm fireworks như bản trước
    revealWinner(row);

    busy = false;
}

async function loop(){
    try{
        const row = await fetchLatest();
        if (row && row.winner_id) {
            if (lastWinnerId === null) lastWinnerId = row.winner_id; // lần đầu vào, không chạy animation
            if (!busy && row.winner_id != lastWinnerId) {
                lastWinnerId = row.winner_id;
                await playSequence(row);
            }
        }
    } catch(e){
        // ignore
    } finally {
        setTimeout(loop, 700); // poll mỗi 0.7s
    }
}

loop();
