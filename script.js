const { Engine, Render, Runner, World, Bodies, Events } = Matter;
let engine = Engine.create();
let world = engine.world;
let canvas = document.getElementById("gameCanvas");

let render = Render.create({
  canvas: canvas,
  engine: engine,
  options: {
    wireframes: false,
    background: "img/game2202-.jpg",
    width: window.innerWidth < 600 ? 320 : 600,
    height: 600
  }
});

Render.run(render);
Runner.run(Runner.create(), engine);

let score = 0;
let scoreDisplay = document.getElementById("score-value");
let enemyScoreDisplay = document.getElementById("enemyScoreDisplay");
let ground = Bodies.rectangle(300, 580, 600, 40, { isStatic: true });
World.add(world, ground);

// 🎯 ランダムボール生成（ゲームオーバーラインより下）
function spawnBall() {
  const x = Math.random() * 500 + 50;
  const y = Math.random() * 40 + 520;
  const ball = Bodies.circle(x, y, 20, {
    restitution: 0.8,
    render: { fillStyle: "#ffcc00" }
  });
  World.add(world, ball);
}
setInterval(spawnBall, 2000);

// 💾 スコアランキング保存
function saveScore(name, value) {
  let ranking = JSON.parse(localStorage.getItem("ranking") || "[]");
  ranking.push({ name, value });
  ranking.sort((a, b) => b.value - a.value);
  ranking = ranking.slice(0, 10);
  localStorage.setItem("ranking", JSON.stringify(ranking));
  displayRanking();
}

function displayRanking() {
  const ranking = JSON.parse(localStorage.getItem("ranking") || "[]");
  const list = document.getElementById("ranking-list");
  list.innerHTML = ranking.map((r, i) => `<li>${i + 1}. ${r.name}: ${r.value}</li>`).join("");
}
displayRanking();

// 🧩 PeerJS 通信設定
let peer, conn;
const myIdSpan = document.getElementById("myId");

document.getElementById("createRoom").onclick = () => {
  const customId = document.getElementById("myCustomId").value.trim();
  peer = new Peer(customId || undefined);
  peer.on("open", id => (myIdSpan.textContent = id));
  peer.on("connection", c => setupConnection(c));
};

document.getElementById("joinRoom").onclick = () => {
  const joinId = document.getElementById("joinId").value.trim();
  peer = new Peer();
  peer.on("open", id => (myIdSpan.textContent = id));
  conn = peer.connect(joinId);
  setupConnection(conn);
};

function setupConnection(c) {
  conn = c;
  conn.on("data", data => {
    if (data.type === "score") enemyScoreDisplay.textContent = data.value;
  });
}

// 💥 スコア加算イベント
Events.on(engine, "collisionStart", e => {
  e.pairs.forEach(pair => {
    if (!pair.bodyA.isStatic && !pair.bodyB.isStatic) {
      score += 10;
      scoreDisplay.textContent = score;
      if (conn) conn.send({ type: "score", value: score });
      if (score % 50 === 0) saveScore(myIdSpan.textContent, score);
    }
  });
});

// 📱 画面サイズに合わせてリサイズ
window.addEventListener("resize", () => {
  render.canvas.width = window.innerWidth < 600 ? 320 : 600;
  render.canvas.height = 600;
});
