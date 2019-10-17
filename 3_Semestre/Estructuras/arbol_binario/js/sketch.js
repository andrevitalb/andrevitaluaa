/*
    Santiago André Vital Betanzos
    Universidad Autónoma de Aguascalientes
    Ing. en Computación Inteligente
    3° Semestre
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

  background(0);

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
