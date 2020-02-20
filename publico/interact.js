// digitado em tipo, um dia, por bruno borges paschoalinoto
// para uso por alunos da poli
// contém o código que conecta a página à MVN
// licença MIT
// não repara a bagunça

let maquina = null;
let teclados = [];
let monitores = [];
let impressoras = [];
let entradas = [];
let saidas = [];
let disco = null;

// retorna a entrada selecionada
function entrada_selecionada() {
  return entradas[parseInt(document.getElementById("ins").value)];
}

// retorna a saída selecionada
function saida_selecionada() {
  return saidas[parseInt(document.getElementById("outs").value)];
}

// atualiza a textarea da entrada selecionada
function update_entrada() {
  let backend = entrada_selecionada();
  let showable = backend.hexa();
  let format = document.getElementById("in_format").value;
  document.getElementById("in_disp").value = showable;
  if (format == "decimal") showable = backend.decimal();
  else if (format == "ascii") showable = backend.ascii();
  document.getElementById("in_disp").value = showable;
}

// atualiza a textarea da saída selecionada
function update_saida() {
  let backend = saida_selecionada();
  let showable = backend.hexa();
  let format = document.getElementById("out_format").value;
  if (format == "decimal") showable = backend.decimal();
  else if (format == "ascii") showable = backend.ascii();
  document.getElementById("out_disp").value = showable;
}

// carregar um valor hexadecimal na entrada selecionada
function in_hex() {
  let backend = entrada_selecionada();
  let s = NaN;
  do {
    s = parseInt(prompt("Insira uma word de quatro nibbles como 00A0 ou F0DA.",
                        "0000"), 16);
  } while (isNaN(s));
  backend.inserir(s);
  update_entrada();
}

// carregar um valor decimal na entrada selecionada
function in_dec() {
  let backend = entrada_selecionada();
  let s = -1;
  do {
    s = parseInt(prompt("Insira um número de 0 a 65535.", "0"), 10);
  } while (isNaN(s) || s > 65535 || s < 0);
  backend.inserir(s);
  update_entrada();
}

// carregar um valor ASCII na entrada selecionada
function in_ascii() {
  let backend = entrada_selecionada();
  let s = prompt("Digite uma string (número par de caracteres):", "")
  if (s.length % 2) s = "\0" + s;
  for (let i = 0; i < s.length - 1; i += 2) {
    let high = s.charCodeAt(i) << 8;
    let low = s.charCodeAt(i+1);
    backend.inserir(high + low);
  }
  update_entrada();
}

// limpar o que está na fila da entrada selecionada
function clr_in() {
  let backend = entrada_selecionada();
  backend.limpar();
  update_entrada();
}

// limpar o display da saída selecionada
function clr_out() {
  let backend = saida_selecionada();
  backend.limpar();
  update_saida();
}

// carregar o programa do usuário e instanciar a MVN
function carregar() {
  // primeiro, instanciar as entradas, saídas, e disco
  let tecs = parseInt(document.getElementById("ntec").value);
  let mons = parseInt(document.getElementById("nmon").value);
  let imps = parseInt(document.getElementById("nimp").value);

  while (mons + imps) {
    let nome = "???";
    let arr = null;
    if (mons) {
      nome = "Monitor";
      arr = monitores;
      mons--;
    } else {
      nome = "Impressora";
      arr = impressoras;
      imps--;
    }
    let obj = new entrada_generica();
    saidas.push(obj);
    arr.push(obj);
    let opt = document.createElement("option");
    opt.innerText = nome + " #" + (arr.length - 1);
    opt.value = arr.length - 1;
    document.getElementById("outs").appendChild(opt);
  }

  for (let i = 0; i < tecs; i++) {
    teclados.push(new entrada_generica());
    let opt = document.createElement("option");
    opt.innerText = "Teclado #" + i;
    opt.value = i;
    document.getElementById("ins").appendChild(opt);
  }

  entradas = teclados;
  disco = new disco_generico();

  // agora, instanciar a mvn e carregar o programa
  let prog = document.getElementById("programa").value;
  let versao = parseInt(document.getElementById("versao").value);
  maquina = new mvn(prog, teclados, monitores, impressoras, disco, versao);
  document.getElementById("loader").style.display = "none";
  document.getElementById("mvn").style.display = "block";
  atualizar_tudo();
}

// atualizar o display de memória
function mostrar_memoria() {
  // listar endereços, colocando um null onde houver gap, pra botar "..."
  let enderecos = [];
  for (key in maquina.memoria) {
    if (maquina.memoria.hasOwnProperty(key)) enderecos.push(key); 
  }
  let com_gaps = [];
  let anterior = null;
  for (addr of enderecos) {
    if (anterior != (addr - 2) && anterior) com_gaps.push(null);
    com_gaps.push(addr);
  }
  // agora, preencher a tabela!
  let tb = document.getElementById("memoria");
  tb.innerHTML = "";
  for (addr of com_gaps) {
    let tr = document.createElement("tr");
    let td_addr = document.createElement("td");
    let td_hex = document.createElement("td");
    let td_dec = document.createElement("td");
    let td_char = document.createElement("td");
    if (addr === null) {
      td_addr.innerText = "...";
      td_hex.innerText = "...";
      td_dec.innerText = "...";
      td_char.innerText = "...";
    } else {
      td_addr.innerText = new word(4, addr).to_hex();
      if (td_addr.innerText == maquina.reg("IC").to_hex()) {
        tr.style.color = "green";
        tr.style.fontWeight = "bold";
      }
      td_hex.innerText = maquina.memoria[addr].to_hex();
      td_dec.innerText = maquina.memoria[addr].to_dec_tc();
      td_char.innerText = maquina.memoria[addr].to_ascii();
    }
    tr.appendChild(td_addr);
    tr.appendChild(td_hex);
    tr.appendChild(td_dec);
    tr.appendChild(td_char);
    tb.appendChild(tr);
  }
}

function atualizar_estado() {
  document.getElementById("estado").innerText = maquina.estado;
}

function atualizar_registradores() {
  let regs = [];
  for (nome in maquina.registradores) 
    if (maquina.registradores.hasOwnProperty(nome)) regs.push(nome);

  let tb = document.getElementById("registradores");
  tb.innerHTML = "";
  for (nome of regs) {
    let tr = document.createElement("tr");
    let td_nome = document.createElement("td");
    let td_hex = document.createElement("td");
    let td_dec = document.createElement("td");
    let td_char = document.createElement("td");
    td_nome.innerText = nome;
    td_hex.innerText = maquina.reg(nome).to_hex();
    td_dec.innerText = maquina.reg(nome).to_dec_tc();
    td_char.innerText = maquina.reg(nome).to_char();
    tr.appendChild(td_nome);
    tr.appendChild(td_hex);
    tr.appendChild(td_dec);
    tr.appendChild(td_char);
    tb.appendChild(tr);
  }
}

function atualizar_disco() {
  let high = document.getElementById("sector").value;
  let formato = document.getElementById("formato_disco").value;
  let addr = new word(3);
  for (let lows = 0x00; lows <= 0xFF; lows++) {
    let hlows = new word(2, lows).to_hex();
    addr.load_hex(high + hlows);
    let value = disco.acesso(addr.us());
    let elem = document.getElementById("disco_ul_" + hlows);
    let texto = value.to_hex();
    if (formato == "decimal") {
      texto = value.tc();
    } else if (formato == "ascii") {
      texto = value.to_ascii();
    }
    elem.innerText = texto;
  }
}

function carregar_disco() {
  let s = prompt("Cole o conteúdo do arquivo abaixo:");
  if (s) maquina.disco.loads(s);
  atualizar_disco();
}

function atualizar_tudo() {
  atualizar_estado();
  atualizar_disco();
  mostrar_memoria();
  atualizar_registradores();
  update_entrada();
  update_saida();
}

function step() {
  maquina.executar();
  atualizar_tudo();
}

function restart() {
  maquina.restart();
  atualizar_tudo();
}

// auto-execução a 10 Hz
let looper = null;
function toggle_auto(btn) {
  if (!looper) {
    looper = setInterval(step, 100);
    btn.innerText = "Parar";
  } else {
    clearInterval(looper);
    looper = null;
    btn.innerText = "Executar a 10 Hz";
  }
}

// ativar os atalhos de teclado
document.body.addEventListener("keypress", function(e) {
  if (!maquina) return;
  let c = String.fromCharCode(e.which).toUpperCase();
  switch (c) {
    case "N":
      step();
      break;
    case "A":
      toggle_auto(document.getElementById("btn_auto"));
      break;
    case "R":
      restart();
      break;
  }
});

// preencher as coisas do visualizador de disco
let sec_sel = document.getElementById("sector");
let sec_th = document.getElementById("th_disco");
let sec_tb = document.getElementById("disco");
for (let i = 0x0; i <= 0xF; i++) {
  // primeiro, a seleção de setor
  let sec_opt = document.createElement("option");
  let hex = new word(1, i).to_hex();
  sec_opt.innerText = hex + "00 - " + hex + "FF";
  sec_opt.value = hex;
  sec_sel.appendChild(sec_opt);
  // agora, umas coisas no thead
  let extra_th = document.createElement("td");
  extra_th.innerText = hex;
  sec_th.appendChild(extra_th);
  // e preparar cada linha da tabela também
  let dlinha = document.createElement("tr");
  let primeiro_td = document.createElement("td");
  primeiro_td.innerText = hex;
  dlinha.appendChild(primeiro_td);
  for (let j = 0x0; j <= 0xF; j++) {
    let mais_um_td = document.createElement("td");
    let ultimo_hex = new word(1, j).to_hex();
    mais_um_td.id = "disco_ul_" + hex + ultimo_hex;
    dlinha.appendChild(mais_um_td);
  }
  sec_tb.appendChild(dlinha);
}
