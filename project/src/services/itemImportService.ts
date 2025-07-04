export interface ImportedItem {
  id: string;
  nombre: string;
  label?: string;
  weight?: number;
  stack?: boolean;
  close?: boolean;
  degrade?: number; // Cambiado a number (minutos)
  decay?: boolean;
  type?: string;
  description?: string;
  image?: string;
  // Permitir cualquier propiedad adicional
  [key: string]: any;
}

export interface ImportResult {
  success: boolean;
  items: ImportedItem[];
  errors: string[];
  warnings: string[];
}

class ItemImportService {
  /**
   * Procesa el contenido importado y convierte a formato de items
   */
  processImport(content: string): ImportResult {
    const result: ImportResult = {
      success: false,
      items: [],
      errors: [],
      warnings: []
    };

    try {
      // Limpiar el contenido
      const cleanContent = this.cleanContent(content);
      
      if (!cleanContent.trim()) {
        result.errors.push('El contenido está vacío');
        return result;
      }

      // Intentar diferentes formatos con manejo robusto
      const parsedData = this.tryParseFormats(cleanContent);
      
      if (!parsedData) {
        result.errors.push('No se pudo procesar el formato del archivo. Asegúrate de que sea un formato válido (JSON, JavaScript Object, o Lua Table)');
        return result;
      }

      // Convertir a items
      const items = this.convertToItems(parsedData);
      
      if (items.length === 0) {
        result.errors.push('No se encontraron items válidos en el archivo');
        return result;
      }

      result.items = items;
      result.success = true;
      
      // Agregar información sobre propiedades preservadas
      this.addPropertyInfo(items, result);

    } catch (error) {
      console.error('Error en processImport:', error);
      result.errors.push(`Error al procesar el archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }

    return result;
  }

  /**
   * Limpia el contenido removiendo comentarios
   */
  private cleanContent(content: string): string {
    return content
      .replace(/--\[\[[\s\S]*?\]\]/g, '') // Comentarios de bloque Lua
      .replace(/--.*$/gm, '') // Comentarios de línea Lua
      .replace(/\/\*[\s\S]*?\*\//g, '') // Comentarios de bloque JS
      .replace(/\/\/.*$/gm, '') // Comentarios de línea JS
      .trim();
  }

  /**
   * Intenta parsear el contenido en diferentes formatos
   */
  private tryParseFormats(content: string): any {
    console.log('Intentando parsear contenido:', content.substring(0, 200) + '...');

    // 1. Intentar JSON directo
    try {
      const jsonResult = JSON.parse(content);
      console.log('Parseado como JSON exitoso');
      return jsonResult;
    } catch (e) {
      console.log('No es JSON válido:', e);
    }

    // 2. Intentar Lua Table (más específico para tu caso)
    try {
      const luaResult = this.parseLuaTable(content);
      if (luaResult) {
        console.log('Parseado como Lua Table exitoso');
        return luaResult;
      }
    } catch (e) {
      console.log('Error parseando Lua:', e);
    }

    // 3. Intentar JavaScript Object
    try {
      const jsResult = this.parseJavaScript(content);
      if (jsResult) {
        console.log('Parseado como JavaScript exitoso');
        return jsResult;
      }
    } catch (e) {
      console.log('Error parseando JavaScript:', e);
    }

    console.log('No se pudo parsear en ningún formato');
    return null;
  }

  /**
   * Parsea JavaScript object/array
   */
  private parseJavaScript(content: string): any {
    // Remover exports y returns
    let cleanJs = content
      .replace(/^export\s+default\s+/, '')
      .replace(/^module\.exports\s*=\s*/, '')
      .replace(/^exports\s*=\s*/, '')
      .replace(/^return\s+/, '');

    // Si no empieza con { o [, agregarlo
    if (!cleanJs.trim().startsWith('{') && !cleanJs.trim().startsWith('[')) {
      cleanJs = `{${cleanJs}}`;
    }

    // Evaluar de forma segura
    const func = new Function(`return ${cleanJs}`);
    return func();
  }

  /**
   * Parsea tabla de Lua y convierte a JavaScript object
   */
  private parseLuaTable(content: string): any {
    console.log('Parseando Lua table...');
    
    // Remover 'return' al inicio
    let luaContent = content.replace(/^return\s+/, '').trim();
    
    // Verificar que empiece y termine con llaves
    if (!luaContent.startsWith('{')) {
      luaContent = '{' + luaContent;
    }
    if (!luaContent.endsWith('}')) {
      luaContent = luaContent + '}';
    }
    
    console.log('Contenido Lua limpio:', luaContent.substring(0, 200) + '...');
    
    // Convertir sintaxis de Lua a JavaScript
    const jsContent = this.convertLuaToJs(luaContent);
    
    console.log('Contenido convertido a JS:', jsContent.substring(0, 200) + '...');
    
    try {
      const func = new Function(`return ${jsContent}`);
      const result = func();
      console.log('Resultado del parsing:', result);
      return result;
    } catch (error) {
      console.error('Error ejecutando función:', error);
      throw new Error(`Error parsing Lua table: ${error}`);
    }
  }

  /**
   * Convierte sintaxis de Lua a JavaScript de manera más robusta
   */
  private convertLuaToJs(luaContent: string): string {
    console.log('Convirtiendo Lua a JS...');
    
    let jsContent = luaContent;
    
    // Paso 1: Convertir ['key'] = value a "key": value
    jsContent = jsContent.replace(/\[['"]([^'"]+)['"]\]\s*=\s*/g, '"$1": ');
    
    // Paso 2: Convertir [key] = value a "key": value (sin comillas en la key original)
    jsContent = jsContent.replace(/\[([^\]'"]+)\]\s*=\s*/g, '"$1": ');
    
    // Paso 3: Convertir key = value a "key": value (para keys sin corchetes)
    jsContent = jsContent.replace(/([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*/g, '"$1": ');
    
    // Paso 4: Manejar valores booleanos
    jsContent = jsContent.replace(/:\s*true\b/g, ': true');
    jsContent = jsContent.replace(/:\s*false\b/g, ': false');
    
    // Paso 5: Convertir strings con comillas simples a dobles
    jsContent = jsContent.replace(/:\s*'([^']*)'/g, ': "$1"');
    
    // Paso 6: Agregar comas donde falten
    // Entre propiedades (antes de una nueva línea que empieza con ")
    jsContent = jsContent.replace(/([}\]"'\d])\s*\n\s*"/g, '$1,\n"');
    
    // Paso 7: Limpiar comas finales antes de }
    jsContent = jsContent.replace(/,(\s*})/g, '$1');
    
    // Paso 8: Asegurar que los números no tengan comas innecesarias
    jsContent = jsContent.replace(/(\d+),(\s*\n\s*})/g, '$1$2');
    
    console.log('Conversión completada');
    return jsContent;
  }

  /**
   * Convierte los datos parseados a formato de items
   */
  private convertToItems(data: any): ImportedItem[] {
    console.log('Convirtiendo datos a items:', data);
    const items: ImportedItem[] = [];

    if (Array.isArray(data)) {
      // Si es un array, procesar cada elemento
      data.forEach((item, index) => {
        const convertedItem = this.convertSingleItem(item, index.toString());
        if (convertedItem) {
          items.push(convertedItem);
        }
      });
    } else if (typeof data === 'object' && data !== null) {
      // Si es un objeto, procesar cada propiedad
      Object.entries(data).forEach(([key, value]) => {
        const convertedItem = this.convertSingleItem(value, key);
        if (convertedItem) {
          items.push(convertedItem);
        }
      });
    }

    console.log('Items convertidos:', items);
    return items;
  }

  /**
   * Convierte un item individual preservando TODAS las propiedades
   */
  private convertSingleItem(itemData: any, id: string): ImportedItem | null {
    if (typeof itemData !== 'object' || itemData === null) {
      return null;
    }

    // Crear el item preservando TODAS las propiedades originales
    const item: ImportedItem = {
      id: id, // Este es el ID original del item (ej: 'hamburguesa_clásica')
      nombre: itemData.label || itemData.name || itemData.nombre || id,
      // Copiar TODAS las propiedades del item original
      ...itemData
    };

    // Asegurar que tenga un nombre válido
    if (!item.nombre || item.nombre.trim() === '') {
      item.nombre = id;
    }

    console.log('Item convertido:', item);
    return item;
  }

  /**
   * Agrega información sobre propiedades preservadas
   */
  private addPropertyInfo(items: ImportedItem[], result: ImportResult): void {
    const managedProperties = new Set(['id', 'nombre', 'label', 'weight', 'stack', 'close', 'degrade', 'decay', 'description', 'image']);
    const allProperties = new Set<string>();
    const preservedProperties = new Set<string>();

    items.forEach(item => {
      Object.keys(item).forEach(key => {
        allProperties.add(key);
        if (!managedProperties.has(key)) {
          preservedProperties.add(key);
        }
      });
    });

    if (preservedProperties.size > 0) {
      result.warnings.push(
        `Se preservaron ${preservedProperties.size} propiedades adicionales: ${Array.from(preservedProperties).join(', ')}`
      );
      result.warnings.push(
        'Las propiedades adicionales se mantendrán intactas y solo podrás editar las propiedades que maneja el sistema'
      );
    }

    result.warnings.push(
      `Se importaron ${items.length} items con ${allProperties.size} propiedades en total`
    );
  }

  /**
   * Valida un item antes de guardarlo
   */
  validateItem(item: ImportedItem): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!item.nombre || item.nombre.trim() === '') {
      errors.push('El nombre del item es requerido');
    }

    if (!item.id || item.id.trim() === '') {
      errors.push('El ID del item es requerido');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Genera un ID válido para el item basado en el nombre
   */
  generateItemId(nombre: string): string {
    return nombre
      .toLowerCase()
      .replace(/[áàäâ]/g, 'a')
      .replace(/[éèëê]/g, 'e')
      .replace(/[íìïî]/g, 'i')
      .replace(/[óòöô]/g, 'o')
      .replace(/[úùüû]/g, 'u')
      .replace(/ñ/g, 'n')
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  /**
   * Genera código de preview del item en formato Lua válido para GTA
   * Preserva TODAS las propiedades originales y mantiene el ID original
   */
  generateItemCode(item: any): string {
    // CLAVE: Usar el original_id si existe, sino usar el id, sino generar uno basado en el nombre
    let itemId: string;
    
    if (item.original_id) {
      // Si tiene original_id, usarlo (viene de importación)
      itemId = item.original_id;
    } else if (item.id && typeof item.id === 'string' && !item.id.match(/^\d+$/)) {
      // Si el id es string y no es solo números, usarlo
      itemId = item.id;
    } else {
      // Generar ID basado en el nombre
      itemId = this.generateItemId(item.nombre || item.label || 'new_item');
    }
    
    // Construir el objeto del item preservando TODAS las propiedades
    const itemData: any = {};
    
    // Si el item tiene metadata (propiedades originales), empezar con esas
    if (item.metadata && typeof item.metadata === 'object') {
      Object.assign(itemData, item.metadata);
    } else {
      // Si no hay metadata, copiar todas las propiedades del item original
      Object.keys(item).forEach(key => {
        if (!['id', 'nombre', 'negocio_id', 'tipo', 'vencimiento_horas', 'imagen', 'fecha_creacion', 'original_id'].includes(key)) {
          itemData[key] = item[key];
        }
      });
    }
    
    // Sobrescribir solo las propiedades que manejamos en el sistema
    if (item.label || item.nombre) {
      itemData.label = item.label || item.nombre;
    }
    
    if (item.weight !== undefined && item.weight !== null) {
      itemData.weight = item.weight;
    }
    
    // Propiedades booleanas - solo incluir si son true
    if (item.stack === true) {
      itemData.stack = true;
    } else if (item.stack === false) {
      // Si es explícitamente false, eliminar la propiedad
      delete itemData.stack;
    }
    
    if (item.close === true) {
      itemData.close = true;
    } else if (item.close === false) {
      delete itemData.close;
    }
    
    // Degrade como valor numérico en minutos
    if (item.degrade !== undefined && item.degrade !== null) {
      if (item.degrade > 0) {
        itemData.degrade = item.degrade;
      } else {
        delete itemData.degrade;
      }
    }
    
    if (item.decay === true) {
      itemData.decay = true;
    } else if (item.decay === false) {
      delete itemData.decay;
    }
    
    // Propiedades adicionales del sistema
    if (item.description) {
      itemData.description = item.description;
    }
    
    if (item.imagen) {
      itemData.image = item.imagen;
    }
    
    // Generar el código Lua
    return this.formatAsLuaItem(itemId, itemData);
  }

  /**
   * Formatea un item como entrada de tabla Lua para GTA
   */
  private formatAsLuaItem(itemId: string, itemData: any): string {
    let luaCode = `['${itemId}'] = {\n`;
    
    const entries = Object.entries(itemData);
    
    entries.forEach(([key, value], index) => {
      const isLast = index === entries.length - 1;
      
      if (typeof value === 'string') {
        luaCode += `\t\t${key} = '${value}'`;
      } else if (typeof value === 'boolean') {
        luaCode += `\t\t${key} = ${value}`;
      } else if (typeof value === 'number') {
        luaCode += `\t\t${key} = ${value}`;
      } else if (typeof value === 'object' && value !== null) {
        // Para objetos anidados (como client)
        luaCode += `\t\t${key} = ${this.formatAsLuaTable(value, 2)}`;
      } else {
        luaCode += `\t\t${key} = ${value}`;
      }
      
      if (!isLast) {
        luaCode += ',';
      }
      luaCode += '\n';
    });
    
    luaCode += '\t}';
    
    return luaCode;
  }

  /**
   * Formatea un objeto como tabla de Lua anidada
   */
  private formatAsLuaTable(obj: any, indentLevel: number = 1): string {
    const tabs = '\t'.repeat(indentLevel);
    const innerTabs = '\t'.repeat(indentLevel + 1);
    
    if (typeof obj !== 'object' || obj === null) {
      if (typeof obj === 'string') {
        return `'${obj}'`;
      }
      return String(obj);
    }

    const entries = Object.entries(obj);
    if (entries.length === 0) {
      return '{}';
    }

    let result = '{\n';
    
    entries.forEach(([key, value], index) => {
      const isLast = index === entries.length - 1;
      
      if (typeof value === 'object' && value !== null) {
        result += `${innerTabs}${key} = ${this.formatAsLuaTable(value, indentLevel + 1)}`;
      } else if (typeof value === 'string') {
        result += `${innerTabs}${key} = '${value}'`;
      } else {
        result += `${innerTabs}${key} = ${value}`;
      }
      
      if (!isLast) {
        result += ',';
      }
      result += '\n';
    });
    
    result += `${tabs}}`;
    return result;
  }

  /**
   * Genera código completo de múltiples items en formato Lua
   */
  generateMultipleItemsCode(items: any[]): string {
    let luaCode = 'return {\n\n';
    
    items.forEach((item, index) => {
      const isLast = index === items.length - 1;
      const itemCode = this.generateItemCode(item);
      
      luaCode += '\t' + itemCode;
      
      if (!isLast) {
        luaCode += ',';
      }
      luaCode += '\n\n';
    });
    
    luaCode += '}';
    
    return luaCode;
  }
}

export const itemImportService = new ItemImportService();
