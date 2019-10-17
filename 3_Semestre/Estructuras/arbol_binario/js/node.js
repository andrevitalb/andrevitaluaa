/*
    Santiago André Vital Betanzos
    Universidad Autónoma de Aguascalientes
    Ing. en Computación Inteligente
    3° Semestre

    Dr. en C. Luis Fernando Gutiérrez Marfileño
    Estructuras Computacionales Avanzadas

    Programa que crea un árbol binario y realiza los recorridos
    preorden, inorder y postorden
*/

var traversal = [];

// Nodos
function Node(val, x, y) {
  this.value = val;
  this.left = null;
  this.right = null;
  // La distancia que debe de haber entre los nodos hijos
  // Este valor se basa en en "nivel" del árbol
  this.distance = 2;
  // Posición en el canvas
  this.x = x;
  this.y = y;
}

// Buscar un valor en el árbol
Node.prototype.search = function(val) {
  if (this.value == val) {
    return this;
  } else if (val < this.value && this.left != null) {
    return this.left.search(val);
  } else if (val > this.value && this.right != null) {
    return this.right.search(val);
  }
  return null;
}

Node.prototype.visit = function(parent) {
  // Ir recursivamente a la izquierda
  if (this.left != null) {
    this.left.visit(this);
  }

  // Dibuja una línea desde el nodo padre
  stroke(100);
  line(parent.x, parent.y, this.x, this.y);
  // Dibuja un círculo
  stroke(255);
  fill(0);
  ellipse(this.x, this.y, 35, 35);
  noStroke();
  // Muestra el valor
  fill(255);
  textAlign(CENTER);
  textSize(18);
  text(this.value, this.x, this.y + 6);

  // Ir hacia la derecha
  if (this.right != null) {
    this.right.visit(this);
  }
}

Node.prototype.preorder = function(nde) {
  // Agregamos el valor actual
  traversal.push(nde.value);

  // Ir recursivamente a la izquierda
  if (nde.left != null) {
    nde.left.preorder(nde.left);
  } 
  if (nde.right != null) {
    nde.right.preorder(nde.right);
  }

  return traversal;
}

Node.prototype.inorder = function(nde) {
  // Ir recursivamente a la izquierda
  if (nde.left != null) {
    nde.left.inorder(nde.left);
  } 

  // Agregamos el valor actual
  traversal.push(nde.value);

  if (nde.right != null) {
    nde.right.inorder(nde.right);
  }

  return traversal;
}

Node.prototype.postorder = function(nde) {
  // Ir recursivamente a la izquierda
  if (nde.left != null) {
    nde.left.postorder(nde.left);
  } 
  if (nde.right != null) {
    nde.right.postorder(nde.right);
  }

  // Agregamos el valor actual
  traversal.push(nde.value);

  return traversal;
}


// Agregar un nuevo nodo
Node.prototype.addNode = function(n) {
  // Si es menor, ir a la izquierda
  if (n.value < this.value) {
    // Si no hay nada ahí, colocar el nodo
    if (this.left == null) {
      this.left = n;
      // Reducir la distancia exponencialmente entre los nodos, por cada nivel
      this.left.x = this.x - (width / pow(2, n.distance));
      this.left.y = this.y + (height / 12);
    } else {
      n.distance++;
      this.left.addNode(n)
    }
    // Si es mayir, ir a la derecha
  } else if (n.value > this.value) {
    // Si no hay nada ahí, colocar el nodo
    if (this.right == null) {
      this.right = n;
      this.right.x = this.x + (width / pow(2, n.distance));
      this.right.y = this.y + (height / 12);
    } else {
      n.distance++;
      this.right.addNode(n);
    }
  }
}
