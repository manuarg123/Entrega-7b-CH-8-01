//Habilito uso manejo de archivos
const fs = require("fs");

class Contenedor{
    constructor(filename, keys){
        this._filename = filename;//Si es producto o carrito
        this._keys = [...keys, "id"]; //Para admitir un número indefinido de keys, que cambian segun es producto o carrito
        this._readFileOrCreateNewOne();
    }

    _validarKeyexistente(newData){
        const objectKeys = Object.keys(newData);
        let exists = false;

        objectKeys.forEach((key) => {
            if (this._keys.includes(key)) {
                exists = true;
            }
        })
        return exists;
    }

    //Realiza la lectura del archivo json
    async _readFileOrCreateNewOne() {
        try {
          await fs.promises.readFile(this._filename, "utf-8");
        } catch (error) {
          error.code === "ENOENT"
            ? this._createEmptyFile()
            : console.log(
                `Error Code: ${error.code} | Ocurrio un error inesperado al intentar leer ${this._filename}`
              );
        }
    }

    //Recibe entradas para el archivo json y las crea sino existen
    async _createEmptyFile() {
        fs.writeFile(this._filename, "[]", (error) => {
          error
            ? console.log(error)
            : console.log(`File ${this._filename} was created since it didn't exist in the system`);
        });
    }

    //Hace una búsqueda por id del producto
    async getById(id) {
        //Recibe un id y lo transforma en número
        id = Number(id);
        try {
          //Busca la información cargada
          const data = await this.getData();
          //Lo transforma en array para usar la funcion find de búsqueda por id
          const parsedData = JSON.parse(data);
    
          return parsedData.find((producto) => producto.id === id);
        } catch (error) {
          console.log(
            `Error: ${error.code} | Hubo un error haciendo la búsqueda en este id (${id})`
          );
        }
      }

      //Elimina un producto por id
      async deleteById(id) {
        try {
          id = Number(id);
          const data = await this.getData();
          const parsedData = JSON.parse(data);
          const objectIdToBeRemoved = parsedData.find(
            (producto) => producto.id === id
          );
          
          //Si hay un producto para eliminar , busca su id dentro del array y lo elimina con splice
          if (objectIdToBeRemoved) {
            const index = parsedData.indexOf(objectIdToBeRemoved);
            parsedData.splice(index, 1);
            await fs.promises.writeFile(this._filename, JSON.stringify(parsedData));
            return true;
          } else {
            //Cuando no existe este producto devuelve el null
            console.log(`ID ${id} no existe en este archivo`);
            return null;
          }
        } catch (error) {
          console.log(
            `Error: ${error.code} | Hubo un error intentando eliminar un producto con este ID (${id})`
          );
        }
      }

      //Actualizar un producto
      async updateById(id, newData) {
        //Recibe la información a agregar, validando que exista la llave a modificar (por ej precio)
        if(this._validateKeysExist(newData)){
          try {
            //Busca el indice de este producto en el json para modificarlo
            id = Number(id);
            const data = await this.getData();
            const parsedData = JSON.parse(data);
            const objectIdToBeUpdated = parsedData.find(
              (producto) => producto.id === id
            );
            if (objectIdToBeUpdated) {
              const index = parsedData.indexOf(objectIdToBeUpdated);
              //Modifica la información de la llave
              objectKeys.forEach( (key) => {
                parsedData[index][key] = newData[key];
              })
              
              //Lo persiste en el json
              await fs.promises.writeFile(this._filename, JSON.stringify(parsedData));
              return true;
            } else {
              //Cuando no existe el id
              console.log(`ID ${id} no existe en la lista de productos`);
              return null;
            }
      
          } catch (error) {
            `Error: ${error.code} | Hubo un error intentando actualizar un producto con este ID (${id})`
          }
        } else {
          return false;
        }
      
        
      }

      //Para agregar productos al carrito
      async addToArrayById(id, objectToAdd) {
        if(this._validateKeysExist(objectToAdd)) {
        try {
          id = Number(id);
          const data = await this.getData();
          const parsedData = JSON.parse(data);
          const objectIdToBeUpdated = parsedData.find(
            (producto) => producto.id === id
          );
          if (objectIdToBeUpdated) {      
            const index = parsedData.indexOf(objectIdToBeUpdated);
            const valorActual = parsedData[index];
            const currentProducts = valorActual['products']
            currentProducts.push(objectToAdd.products)
            
            await fs.promises.writeFile(this._filename, JSON.stringify(parsedData));
            return true;
          } else {
            console.log(`ID ${id} no existe en el archivo`);
            return false;
          }
    
        } catch (error) {
          `Error: ${error.code} |Hubo un error intentando actualizar  (${id})`
        }
        } else {
          return false;
        }
      }

      //Quitar un producto del carrito
      async removeFromArrayById(id, objectToRemoveId, keyName) {
        try {
          id = Number(id);
          const data = await this.getData();
          const parsedData = JSON.parse(data);
          
          const objectIdToBeUpdated = parsedData.find(
            (producto) => producto.id === id
          );
          
          if (objectIdToBeUpdated) {
            const index = parsedData.indexOf(objectIdToBeUpdated);
            
            const valorActual = parsedData[index][keyName];
            let indexToBeRemoved = -1;
            valorActual.forEach((element, indexE) => {
              if(element.id == objectToRemoveId) {
                indexToBeRemoved = indexE
              }
            })
            const newArray = [...valorActual];
            
            if (indexToBeRemoved>-1) {
              console.log(indexToBeRemoved)
              newArray.splice(indexToBeRemoved,1)
            }
        
            parsedData[index][keyName] = newArray;
            await fs.promises.writeFile(this._filename, JSON.stringify(parsedData));
            return true;
          } else {
            console.log(`ID ${id} No existe en este archivo`);
            return false;
          }
    
        } catch (error) {
          `Error: ${error.code} | Ocurrio un error al intentar eliminar el producto con este ID (${id})`
        }
      
      }
      
      //para guardar el producto en el json
      async save(object) {    
        if(this._validateKeysExist(object)) {
          try {
            const allData = await this.getData();
            const parsedData = JSON.parse(allData);
      
            object.id = parsedData.length + 1;
            parsedData.push(object);
      
            await fs.promises.writeFile(this._filename, JSON.stringify(parsedData));
            return object.id;
          } catch (error) {
            console.log(
              `Error: ${error.code} | Hubo un error intentando guardar este elemento`
            );
          }
        } else {
          return false;
        }
      }

      //Elimina todos los productos
      async deleteAll() {
        try {
          await this._createEmptyFile();
        } catch (error) {
          console.log(
            `Hubo un error (${error.code}) al intentar eliminar todos los productos`
          );
        }
      }
    
      //Obtiene la información cargada en el archivo
      async getData() {
        const data = await fs.promises.readFile(this._filename, "utf-8");
        return data;
      }
      
      //Obtiene todos los productos
      async getAll() {
        const data = await this.getData();
        return JSON.parse(data);
      }
    
}


module.exports = Contenedor;