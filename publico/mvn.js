// digitado em tipo, um dia, por bruno borges paschoalinoto
// para uso por alunos da poli
// contém código que determina o funcionamento interno da MVN
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
      return new word(4);
    }
    let b = new word(4, this.mem[0]);
    this.mem = this.mem.slice(1);
    return b || new word(4);
  };

  // limpar a fila de leitura
  this.limpar = function() {
    this.mem = [];
  };

  // inserir um byte na fila de leitura
  this.inserir = function(b) {
    this.mem.push(new word(4, b));
  };

  // inserir vários bytes
  this.inserir_varios = function(arr) {
    for (b of arr) this.inserir(b);
  };

  // converter em string hexadecimal
  this.hexa = function() {
    return this.mem.reduce((str, n) => str + n.to_hex() + " ", "").trim();
  };

  // converter em string decimal
  this.decimal = function() {
    return this.mem.reduce((str, n) => str + n.to_dec() + " ", "").trim();
  };
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
    this.mem.push(new word(4, b));
  };

  // inserir vários bytes
  this.inserir_varios = function(arr) {
    this.mem += arr;
  };

  // converter em string hexadecimal
  this.hexa = function() {
    return this.mem.reduce((str, n) => str + n.to_hex() + " ", "").trim();
  };

  // converter em string decimal
  this.decimal = function() {
    return this.mem.reduce((str, n) => str + n.to_dec() + " ", "").trim();
  };

  // converter em texto ascii
  this.ascii = function() {
    return this.mem.reduce((str, n) => str + String.fromCharCode(n), "");
  };
}

// aqui, vamos começar a implementar a mvn de fato.
function mvn(programa_inicial, entradas, saidas, versao) {
  this.memoria = {};
  this.memoria_original = {};
  this.versao = versao;

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
    this.memoria = this.copia_memoria(this.memoria_original);
    this.estado = "EXECUTANDO";
    this.registradores = {
      "MAR": new word(4),
      "MDR": new word(4),
      "IC": new word(4),
      "IR": new word(4),
      "AC": new word(4),
    };
    if (versao == 2) this.registradores["RA"] = new word(4);
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
    this.estado = "PARADA";
  };

  // esta função vai tentar carregar um programa, na forma de texto, para a
  // memória da máquina
  this.carregar = function(programa) {
    this.reset();
    programa = programa.toUpperCase();
    // primeiro, remover todos os comentários
    programa = programa.replace(/;.*/g, "");
    // agora, carregar a string de nibbles
    let nibbles = programa.split("").reduce((str, c) => str
                                            + (nibble(c) ? c : ""), "");
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
    this.estado = "EXECUTANDO";
  };

  // acesso a memória, produzindo warning
  this.acesso_seguro = function(endereco) {
    if (endereco in this.memoria) return this.memoria[endereco];
    alert("CUIDADO! Tentativa de acessar um endereço não-inicializado (" + 
                  hexword(endereco) + ")!");
    this.memoria[endereco] = new word(4);
    return this.memoria[endereco];
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
    // não podemos executar se estivermos em erro
    if (this.estado == "ERRO") {
      alert("A máquina não pode continuar, pois está em estado de erro.");
      return;
    }
    if (this.estado == "PARADA") return;
    this.estado = "EXECUTANDO";
    // pegar a instrução atual e atualizar os registradores
    this.reg("IR").set(this.acesso_seguro(this.reg("IC").us()));
    let op = (this.ureg("IR") & 0xF000) >> 12;
    let oi = new word(4, this.ureg("IR") & 0x0FFF);
    let memoi = () => this.acesso_seguro(oi.us());
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
        this.reg("AC").add(memoi());
        this.reg("IC").add(2);
        break;
      case 0x5:
        // subtração
        this.reg("AC").sub(memoi());
        this.reg("IC").add(2);
        break;
      case 0x6:
        // multiplicação
        this.reg("AC").mult(memoi());
        this.reg("IC").add(2);
        break;
      case 0x7:
        // divisão
        this.reg("AC").idiv(memoi());
        this.reg("IC").add(2);
        break;
      case 0x8:
        // colocar memória pro acumulador
        this.reg("AC").set(memoi());
        this.reg("IC").add(2);
        break;
      case 0x9:
        // colocar acumulador pra memória
        memoi().set(this.reg("AC"));
        this.reg("IC").add(2);
        break;
      case 0xA:
        if (versao == 2) {
          // RA recebe IC, IC recebe OI
          this.reg("RA").set(this.reg("IC"));
          this.reg("IC").set(oi);
        } else {
          // MEM[OI] recebe IC+1, IC recebe OI+1
          memoi().set(this.reg("IC"));
          memoi().add(2);
          this.reg("IC").set(oi);
          this.reg("IC").add(2);
        }
        break;
      case 0xB:
        if (versao == 2) {
          // AC recebe memória, IC recebe RA
          this.reg("AC").set(memoi());
          this.reg("IC").set(this.reg("RA"));
        } else {
          // IC recebe MEM[OI]
          this.reg("IC").set(memoi());
        }
        break;
      case 0xC:
        // pausar e aguardar continuação
        this.estado = "PARADA";
        this.reg("IC").set(oi);
        break;
      case 0xD:
        // ler dados da entrada e continuar
        let idisp = oi.us();
        if (idisp >= this.entradas.length) {
          this.fatal("Tentativa de ler um byte da entrada #" + idisp + ", mas só"
                     + " existe até a #" + this.entradas.length + "!");
        } else {
          let entrada = this.entradas[idisp];
          if (entrada.fila()) {
            this.reg("AC").set(entrada.ler());
            this.reg("IC").add(2);
          } else {
            alert("A instrução atual exige ler do dispositivo de entrada #"
                  + idisp + "!");
            this.estado = "AGUARDANDO";
          }
        }
        break;
      case 0xE:
        let disp = oi.us();
        if (disp >= this.saidas.length) {
          this.fatal("Tentativa de botar um byte na saída #" + disp + ", mas só"
                     + " existe até a #" + this.entradas.length + "!");
        } else {
          let saida = this.saida[disp];
          saida.inserir(disp);
          this.reg("IC").add(2);
        }
        break;
      case 0xF:
        this.reg("IC").add(2);
        break;
    }
  };

  this.entradas = entradas;
  this.saidas = saidas;
  this.carregar(programa_inicial);
} 
