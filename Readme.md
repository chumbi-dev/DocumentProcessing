# Sistema de Gestión de Documentos

Este proyecto es un sistema de gestión de documentos que permite subir archivos ZIP que contengan archivos CSV, procesarlos y visualizar los datos extraídos.

## Estructura del Proyecto

- **Backend**: API REST desarrollada con .NET Core
- **Frontend**: Aplicación web desarrollada con React
- **Base de Datos**: SQL Server en Docker

## Requisitos Previos

- [Docker](https://www.docker.com/products/docker-desktop/) y Docker Compose
- [.NET 7 SDK](https://dotnet.microsoft.com/download/dotnet/7.0) o superior
- [Node.js](https://nodejs.org/) (v14 o superior) y npm
- [Git](https://git-scm.com/downloads)

## Despliegue Paso a Paso

### 1. Clonar el Repositorio

```bash
git clone <url-del-repositorio>
cd <nombre-del-repositorio>
```

### 2. Levantar la Base de Datos con Docker Compose

Ejecuta el contenedor de SQL Server:

```bash
docker-compose up -d
```

Verifica que el contenedor esté funcionando:

```bash
docker ps
```

### 3. Configurar y Ejecutar el Backend (.NET Core)

Navega a la carpeta del proyecto backend:

```bash
cd backend/DocumentProcessingAPI
```

Restaura los paquetes NuGet:

```bash
dotnet restore
```

#### Migraciones de la Base de Datos

Para crear una migración inicial (si no existe):

```bash
dotnet ef migrations add InitialCreate
```

Para aplicar las migraciones a la base de datos:

```bash
dotnet ef database update
```

#### Ejecutar la API

```bash
dotnet run
```

La API estará disponible en `http://localhost:5280`.

### 4. Configurar y Ejecutar el Frontend (React)

Navega a la carpeta del proyecto frontend:

```bash
cd frontend
```

Instala las dependencias:

```bash
npm install
```

Inicia la aplicación React:

```bash
npm start
```

La aplicación estará disponible en `http://localhost:3000`.

## Uso del Sistema

1. **Subir Archivos**: 
   - Crea un archivo ZIP que contenga un archivo CSV.
   - El CSV debe tener los siguientes encabezados: PdfName, FirstName, LastName, Age, Address, SSN.
   - Utiliza ";" como separador en el CSV.

2. **Ver Documentos**:
   - En la tabla principal puedes ver todos los archivos subidos.
   - Puedes filtrar por nombre o rango de fechas.
   - Usa el botón "Ver" para visualizar los datos extraídos del CSV.

3. **Eliminar Documentos**:
   - Usa el botón "Eliminar" para borrar un archivo y todos sus registros asociados.
