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

// Árbol binario
var tree;


function setup() {
  createCanvas(700, 700);

  // Nuevo árbol
  tree = new Tree();

  // Agregar 10 valores aleatorios
  for (var i = 0; i < 10; i++) {
    tree.addValue(floor(random(0, 100)));
  }

  background(51);

  // Recorrer el árbol
  tree.traverse();

  // Buscar el número 10 en el árbol
  var result = tree.search(10);
  if (result == null) {
    console.log('No se encontró');
  } else {
    console.log(result);
  }
}
