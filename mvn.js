// digitado em tipo, um dia, por bruno borges paschoalinoto
// para uso por alunos da poli
// licença MIT
// não repara a bagunça

"use script"; // dã


// eu ODIEO js orientado a objetos, mas vou fazer isso em nome da generalidade,
// e caso alguma pobre alma resolva ler meu código...

// dispositivo de entrada genérico, associado a uma array
function entrada_generica() {
  // assegurar o elemento de leitura
  this.mem = [];

  // tamanho da fila de leitura, em bytes
  this.fila = function() {
    return this.mem.length;
  };

  // ler um byte da fila de leitura
  this.ler = function() {
    if (!this.fila()) {
      return new word(2);
    }
    let b = new word(2, this.mem[0]);
    this.mem = this.mem.slice(1);
    return b || new word(2);
  };

  // limpar a fila de leitura
  this.limpar = function() {
    this.mem = [];
  };

  // inserir um byte na fila de leitura
  this.inserir = function(b) {
    this.mem.push(word(2, b));
  };

  // inserir vários bytes
  this.inserir_varios = function(arr) {
    for (b of arr) this.inserir(b);
  };
}

// dispositivo de entrada combinado entre uma textarea, uns botões, etc.
function init_entrada_combinada(ta_hex_display, ta_text_input, btn_hex_input,
                                btn_dec_input, btn_text_input) {
  let backend = new entrada_generica();

  // o que fazer quando querem inserir um byte hexa
  btn_hex_input.addEventListener("click", function() {
    let s = NaN;
    do {
      s = parseInt(prompt("Insira um byte hexadecimal, como 00, 0A, F0, FF, 4B,"
                          + " etc.", "00"), 16);
    } while (isNaN(s));
    backend.inserir(s);
  });

  // o que fazer quando querem inserir um byte decimal
  btn_hex_input.addEventListener("click", function() {
    let s = -1;
    do {
      s = parseInt(prompt("Insira um número de 0 a 255.", "00"), 10);
    } while (isNaN(s) || s > 255 || s < 0);
    backend.inserir(s);
  });

  // o que fazer quando querem inserir bytes a partir de texto
  btn_text_input.addEventListener("click", function() {
    while (ta_hex_display.value.length) {
      // consumir um caractere
      let c = ta_hex_display.value.charCodeAt(0);
      ta_hex_display.value = ta_hex_display.value.splice(1);
      // converter ele para uma string hexa, e disso para lista de bytes
      let bytes = hexpad(Number(c).toString(16));
      backend.inserir_varios(bytes);
    }
  });

  return backend;
}

// dispositivo de saída genérico
function saida_generica() {
  this.mem = [];

  // limpar a saída
  this.limpar = function() {
    this.mem = [];
  };

  // inserir um byte na saída
  this.inserir = function(b) {
    this.mem.push(word(b, 2));
  };

  // inserir vários bytes
  this.inserir_varios = function(arr) {
    this.mem += arr;
  };

  // converter em string hexadecimal
  this.hexa = function() {
    return mem.reduce((str, n) => str + n.to_hex() + " ", "").trim();
  };

  // converter em string decimal
  this.decimal = function() {
    return mem.reduce((str, n) => str + n.to_dec() + " ", "").trim();
  };

  // converter em texto ascii
  this.ascii = function() {
    return mem.reduce((str, n) => str + String.fromCharCode(n), "");
  };

}

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

  function bind_update(obj, fname) {
    let newname = "postbind_" + fname;
    obj[newname] = obj[fname];
    obj[fname] = function() {
      obj[newname]();
      obj.update();
    }
  }

  bind_update(backend, "limpar");
  bind_update(backend, "inserir");
  bind_update(backend, "inserir_varios");

  btn_clear.addEventListener("click", function() {
    backend.limpar();
  });

  sel_type.addEventListener("change", function() {
    backend.update();
  });

  return backend;
}

// aqui, vamos começar a implementar a mvn de fato.
function mvn(programa_inicial, entradas, saidas) {

  this.fatal = function(msg) {
    alert("Um erro fatal impede a continuidade da execução:\n\n" + msg);
    this.estado = "ERRO";
  };

  this.fatal = function(msg) {
    alert("Uma erro não-fatal ocorreu na execução da instrução:\n\n" + msg);
  };

  // cria uma cópia da memória do programa atualmente
  this.copia_memoria = function(obj) {
    if (!obj) obj = this.memoria;
    let c = {};
    for (key in obj) {
      if (!obj.hasOwnProperty(key)) continue;
      c[key] = obj[key].copy();
    }
    return c;
  };

  // reiniciar o programa atual
  this.restart = function() {
    this.memoria = this.copia_memoria(memoria_original);
    this.estado = "EXECUTANDO"
    this.registradores = {
      "MAR": new word(4),
      "MDR": new word(4),
      "IC": new word(4),
      "IR": new word(4),
      "AC": new word(4)
    };
    for (entrada of entradas) {
      entrada.limpar(); 
    }
    for (saida of saidas) {
      saida.limpar(); 
    }
  };

  // resetar a máquina para seu estado inicial, sem programa
  this.reset = function() {
    this.restart();
    this.memoria = {};
    this.memoria_original = {};
    this.estado = "PARADA"
  };

  // esta função vai tentar carregar um programa, na forma de texto, para a
  // memória da máquina
  this.carregar = function(programa) {
    this.reset();
    programa = programa.toUpperCase();
    // primeiro, remover todos os comentários
    programa = programa.replace(/;.*/g, "");
    // agora, carregar a string de nibbles
    let nibbles = programa.reduce((str, c) => str + (nibble(c) ? c : ""), "");
    if (nibbles.length % 8) {
      this.fatal("Programa inválido: após a remoção de comentários, observei "
                 + "que o número de caracteres hexadecimais não é um múltiplo "
                 + "de oito.");
      return;
    }
    while (nibbles.length) {
      // consumir quatro nibbles para o endereço, e quatro para a instrução
      let endereco = parseInt(nibbles.substr(0, 4), 16);
      let instrucao = new word(4, parseInt(nibbles.substr(4, 4), 16));
      nibbles = nibbles.slice(8);
      this.memoria[endereco] = instrucao;
    }
    // criar uma cópia do programa, para poder restartar
    this.memoria_original = this.copia_memoria();
  };

  // acesso a memória, produzindo warning
  this.acesso_seguro = function(endereco) {
    if (endereco in memoria) return memoria[endereco];
    this.warning("Tentativa de acessar um endereço não-inicializado (" + 
                  hexword(endereco) + ")!");
    memoria[endereco] = new word(4);
    return memoria[endereco];
  };

  // acessa um registrador de maneira segura, retornando seu objeto
  this.reg = function(nome) {
    return this.registradores[nome];
  }

  // acessa um registrador de maneira segura, retornando seu valor com sinal
  this.sreg = function(nome) {
    return this.reg(nome).tc();
  }

  // acessa um registrador de maneira segura, retornando seu valor sem sinal
  this.ureg = function(nome) {
    return this.reg(nome).tc();
  }

  // executar uma instrução
  this.executar = function() {
    // pegar a instrução atual e atualizar os registradores
    let op = (this.ureg("IR") & 0xF000) >> 3;
    let oi = new word(4, this.ureg("IR") & 0x0FFF);
    switch (op) {
      case 0x0:
        // salto incondicional
        this.reg("IC").set(oi);
        break;
      case 0x1:
        // salto se acumulador é zero
        if (!this.sreg("AC")) this.reg("IC").set(oi);
        else this.reg("IC").add(2);
        break;
      case 0x2:
        // salto se acuulador é negativo
        if (this.sreg("AC") < 0) this.reg("IC").set(oi);
        else this.reg("IC").add(2);
        break;
      case 0x3:
        // carregar imediato no acumulador
        this.reg("AC").set(oi);
        this.reg("IC").add(2);
        break;
      case 0x4:
        // soma
        let parcela = this.acesso_seguro(oi.us());
        this.reg("AC").add(memoria[oi]);
        this.reg("IC").add(2);
        break;
      case 0x5:
        // subtração
        let subtraendo = this.acesso_seguro(oi.us());
        this.reg("AC").sub(memoria[oi]);
        this.reg("IC").add(2);
        break;
      case 0x6:
        // multiplicação
        let fator = this.acesso_seguro(oi.us());
        this.reg("AC").mult(memoria[oi]);
        this.reg("IC").add(2);
        break;
      case 0x7:
        // divisão
        let divisor = this.acesso_seguro(oi.us());
        this.reg("AC").idiv(memoria[oi]);
        this.reg("IC").add(2);
        break;



    }
  };

  this.entradas = entradas;
  this.saidas = saidas;
  this.carregar(programa_inicial);

}
    
