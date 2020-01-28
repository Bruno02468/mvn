// digitado em tipo, um dia, por bruno borges paschoalinoto
// para uso por alunos da poli
// contém o código que conecta a página à MVN
// licença MIT
// não repara a bagunça

// dispositivo de saída usando elementos HTML
function init_saida_combinada(ta_out, btn_clear, sel_type) {
  let backend = saida_generica();

  backend.update = function() {
    switch (sel_type.value) {
      case "hexa":
        ta_out.innerText = backend.hexa();
        break;
      case "decimal":
        ta_out.innerText = backend.decimal();
        break;
      case "ascii":
        ta_out.innerText = backend.ascii();
        break;
    }
  };

  btn_clear.addEventListener("click", function() {
    backend.limpar();
  });

  sel_type.addEventListener("change", function() {
    backend.update();
  });

  return backend;
}

let maquina = null;
let entradas = [];
let saidas = [];

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
  if (document.getElementById("in_format").value == "decimal")
    showable = backend.decimal();
  document.getElementById("in_disp").value = showable;
}

// atualiza a textarea da saída selecionada
function update_saida() {
  let backend = saida_selecionada();
  let showable = backend.hexa();
  let format = document.getElementById("in_format").value;
  if (format == "decimal") showable = backend.decimal();
  else if (format == "ascii") showable = backend.ascii();
  document.getElementById("in_disp").value = showable;
}

// carregar um valor hexadecimal na entrada selecionada
function in_hex() {
  let backend = entrada_selecionada();
  let s = NaN;
  do {
    s = parseInt(prompt("Insira uma word de quatro nibbles como 00A0 ou F0DA."
                        "00"), 16);
  } while (isNaN(s));
  backend.inserir(s);
  backend.update_textarea();
}

// carregar um valor decimal na entrada selecionada
function in_dec() {
  let backend = entrada_selecionada();
  let s = -1;
  do {
    s = parseInt(prompt("Insira um número de 0 a 65535.", "0"), 10);
  } while (isNaN(s) || s > 65535 || s < 0);
  backend.inserir(s);
  backend.update_textarea();
}

// limpar o que está na fila da entrada selecionada
function clr_in() {
  let backend = entrada_selecionada();
  backend.limpar();
}

// limpar o display da saída selecionada
function clr_in() {
  let backend = saida_selecionada();
  backend.limpar();
}

// carregar o programa do usuário e instanciar a MVN
function carregar() {
  // primeiro, instanciar as entradas e saídas
  let ins = parseInt(document.getElementById("nin").value);
  let outs = parseInt(document.getElementById("nout").value);
  for (let i = 0; i < ins; i++) {
    entradas.push(new entrada_generica(document.getElementById("in_disp")));
    let opt = document.createElement("option");
    opt.innerText = "#" + i;
    opt.value = i;
    document.getElementById("ins").appendChild(opt);
  }
  for (let i = 0; i < outs; i++) {
    entradas.push(new saida_generica(document.getElementById("out_disp")));
    let opt = document.createElement("option");
    opt.innerText = "#" + i;
    opt.value = i;
    document.getElementById("outs").appendChild(opt);
  }
  // agora, instanciar a mvn e carregar o programa
  maquina = new mvn(document.getElementById("programa").value, entradas,
                    saidas);
}

// atualizar o display de memória
function mostrar_memoria() {
  // listar endereços, colocando um null onde houver gap, pra botar "..."
  let enderecos = [];
  for (key in maquina.memoria) {
    if (maquina.memoria.hasOwnProperty(key)) enderecos.push(key);
  }
  enderecos.sort();
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
    let td_a = document.createElement("td");
    let td_d = document.createElement("td");
    if (addr === null) {
      td_a.innerText = "...";
      td_d.innerText = "...";
    } else {
      td_a.innerText = new word(4, addr).to_hex();
      td_d.innerText = maquina.memoria[addr];
    }
    tr.appendChild(td_a);
    tr.appendChild(td_d);
    tb.appendChild(tr);
  }
}
