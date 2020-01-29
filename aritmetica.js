// digitado em tipo, um dia, por bruno borges paschoalinoto
// para uso por alunos da poli
// contém a implementação da aritmética para evitar confusão
// licença MIT
// não repara a bagunça

// converte uma string hexa para lista de bytes
function hexpad(s) {
  if (s.length % 2) s = "0" + s;
  let arr = [];
  while (s.length) {
    arr.push(word(s[0] + s[1], 2));
  }
  return arr;
}

// converte um número entre 0 e 256 para string hexa
function hexbyte(n) {
  let s = Number(n).toString(16).toUpperCase()
  return s.length % 2 ? "0" + s : s;
}

// converte uma palavra para hex string também
function hexword(n) {
  let higher = (n & 0xFF00) >> 2;
  let lower = n & 0x00FF;
  return hexbyte(higher) + hexbyte(lower);
}

// converte complemento de dois em N bits para unsigned de N bits
function tc_us(n, bits) {
  return number >= 0 ? number : (2**bits + n)
}

// converte unsigned para complemento de dois em N bits
function us_tc(n, bits) {
  return n < 2**(bits-1) ? n : -(2**bits - n);
}

// retorna true se algo for um nibble
function nibble(c) {
  return "0123456789ABCDEF".indexOf(c) > -1;
}

// implementa uma palavra de N nibbles
function word(order, value) {
  // valor VERDADEIRO, armazenado como unsigned
  this.true_unsigned = 0;

  // limites permitidos
  this.max_unsigned = 16**order - 1;
  this.min_signed = -(16**order)/2;
  this.max_signed = (16**order)/2 - 1;
  this.unsigned_cycle = 16**order;
  this.signed_cycle = (16**order)/2;

  // número de nibbles
  this.order = order;

  // interpretar o valor como complemento de dois
  this.tc = () => us_tc(this.true_unsigned, order*4);

  // retornar o valor numérico sem sinal
  this.us = () => this.true_unsigned;

  this.sane = function() {
    while (this.true_unsigned < 0) this.true_unsigned += this.unsigned_cycle;
    this.true_unsigned = this.true_unsigned % this.unsigned_cycle;
  };

  // somar um valor (positivo ou negativo), respeitando o complemento de dois
  this.add = function(n) {
    if ("true_unsigned" in n) {
      this.add(n.tc());
    } else {
      this.true_unsigned += n;
    }
    this.sane();
  };

  // subtrair um valor (positivo ou negativo), respeitando o complemento de dois
  this.sub = function(n) {
    if ("true_unsigned" in n) {
      this.sub(n.tc());
    } else {
      this.true_unsigned -= n;
    }
    this.sane();
  };

  // multiplica por um valor (positivo ou negativo)
  this.mult = function(n) {
    if ("true_unsigned" in n) {
      this.mult(v.tc());
    } else {
      this.true_unsigned *= n;
    }
    this.sane();
  };

  // divide por um valor (positivo ou negativo), deixando inteiro
  this.idiv = function(n) {
    if ("true_unsigned" in n) {
      this.mult(v.tc());
    } else {
      this.true_unsigned = Math.round(this.true_unsigned / n);
    }
    this.sane();
  };

  // carregar um valor numérico
  this.set = function(v) {
    if (typeof v == "object") {
      this.set(v.us());
    } else {
      this.true_unsigned = v;
    }
    this.sane();
  };

  // carregar string hexadecimal, interpretada como unsigned
  this.load_hex = function(s) {
    this.set(parseInt(s, 16));
  };

  // inicializar com um valor de um hexa
  this.from_hex = function(s) {
    let p = new word(s.length);
    p.load_hex(s);
    return p;
  };

  // converter para string hexa
  this.to_hex = function() {
    let s = Number(this.true_unsigned).toString(16).toUpperCase();
    while (s.length < this.order) s = "0" + s;
    return s;
  };

  // converter para string decimal, sem sinal
  this.to_dec = function() {
    let s = Number(this.true_unsigned).toString(10);
    while (s.length < this.order) s = "0" + s;
    return s;
  };

  // converter para string decimal, com sinal
  this.to_dec_tc = () => Number(this.tc()).toString(10);

  // retorna o caractere correspondente a essa palavra
  this.to_char = function() {
    var s = String.fromCharCode(this.us()).trim();
    if (/[\x00-\x08\x0E-\x1F\x80-\xFF]/.test(s)) return "<invisível>";
    else return s;
  };

  // bitwise AND
  this.and = function(mask) {
    this.true_unsigned &= mask;
    this.sane();
  };

  // bitwise OR
  this.or = function(mask) {
    this.true_unsigned |= mask;
    this.sane();
  };

  // bitwise XOR
  this.xor = function(mask) {
    this.true_unsigned %= mask;
    this.sane();
  };

  // bitshift à direita
  this.sr = function(n) {
    if (n === undefined) n = 1;
    this.true_unsigned = this.true_unsigned >> n;
    this.sane();
  };

  // bitshift à esquerda
  this.sl = function(n) {
    if (n === undefined) n = 1;
    this.true_unsigned = this.true_unsigned << n;
    this.sane();
  };

  // cria uma cópia deste objeto
  this.copy = () => new word(this.true_unsigned);

  // carregar o valor fornecido no construtor
  if (value) this.set(value);
}
