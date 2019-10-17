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

// Objeto de árbol
function Tree() {
  // Incialización con la raíz
  this.root = null;
}

// Iniciar el recorrido por la raíz
Tree.prototype.traverse = function() {
  this.root.visit(this.root);
}

Tree.prototype.search = function(val) {
  var found = this.root.search(val);
  return found;
}

// Agregar un nuevo valor al árbol
Tree.prototype.addValue = function(val) {
  var n = new Node(val);
  if (this.root == null) {
    this.root = n;
    // Una posición inicial para el nodo raíz
    this.root.x = width / 2;
    this.root.y = 50;
  } else {
    this.root.addNode(n);
  }
}
