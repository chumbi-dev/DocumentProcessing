using Microsoft.AspNetCore.Mvc;
using CsvHelper;
using CsvHelper.Configuration;
using System.Globalization;
using System.IO.Compression;
using DocumentProcessingAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace DocumentProcessingAPI.Controllers;

[ApiController]
[Route("[controller]")]
public class UploadFileController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public UploadFileController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpPost("upload")]
    public async Task<IActionResult> UploadZip(IFormFile file)
    {
        try
        {
            if (file == null || file.Length == 0)
                return BadRequest("Archivo inválido.");

            using var stream = file.OpenReadStream();
            using var archive = new ZipArchive(stream);
            var csvEntry = archive.Entries.FirstOrDefault(e => e.Name.EndsWith(".csv"));

            if (csvEntry == null)
                return BadRequest("CSV no encontrado en el ZIP.");

            // Usar el nombre del archivo ZIP como nombre del archivo subido
            string fileName = file.FileName;

            // Crear y guardar primero el registro de archivo subido
            var uploadedFile = new UploadedFile
            {
                UploadDate = DateTime.UtcNow,
                FileName = fileName,
                Documents = new List<Document>()
            };

            _context.UploadedFiles.Add(uploadedFile);
            await _context.SaveChangesAsync();

            // Leer el CSV
            using var reader = new StreamReader(csvEntry.Open());
            using var csv = new CsvReader(reader, new CsvConfiguration(CultureInfo.InvariantCulture)
            {
                Delimiter = ";",
                HeaderValidated = null,
                MissingFieldFound = null
            });

            // Crear lista para almacenar los documentos
            var documents = new List<Document>();

            // Leer los registros del CSV
            var records = csv.GetRecords<Document>();

            foreach (var record in records)
            {
                var document = new Document
                {
                    PdfName = record.PdfName ?? string.Empty,
                    FirstName = record.FirstName ?? string.Empty,
                    LastName = record.LastName ?? string.Empty,
                    Age = record.Age,
                    Address = record.Address ?? string.Empty,
                    SSN = record.SSN ?? string.Empty,
                    UploadedFileId = uploadedFile.Id
                };

                documents.Add(document);
            }

            // Guardar los documentos en la base de datos
            if (documents.Any())
            {
                _context.Documents.AddRange(documents);
                await _context.SaveChangesAsync();
            }

            return Ok(new
            {
                message = "Archivo procesado correctamente",
                FileName = uploadedFile.FileName,
                TotalDocuments = documents.Count
            });
        }
        catch (DbUpdateException dbEx)
        {
            // Capturar específicamente errores de base de datos
            var innerException = dbEx.InnerException;
            return StatusCode(500, $"Error de base de datos: {innerException?.Message ?? dbEx.Message}");
        }
        catch (Exception ex)
        {
            // Capturar cualquier otra excepción
            return StatusCode(500, $"Error al procesar el archivo: {ex.Message}");
        }
    }


    [HttpGet]
    public IActionResult GetUploadFiles()
    {
        var documents = _context.UploadedFiles.OrderByDescending(x => x.Id).ToList();
        return Ok(documents);
    }

    [HttpGet("{id}")]
    public IActionResult GetUploadFile(int id)
    {
        // Al eliminar la propiedad de navegación inversa, ya no tenemos el problema de referencia circular
        var uploadedFile = _context.UploadedFiles
            .Include(uf => uf.Documents)
            .FirstOrDefault(uf => uf.Id == id);

        if (uploadedFile == null)
            return NotFound("Documento no encontrado.");

        // Ya no necesitamos crear un objeto anónimo para evitar la referencia circular
        return Ok(uploadedFile);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUploadFile(int id)
    {
        try
        {
            // Obtener el UploadedFile con sus documentos relacionados
            var uploadedFile = await _context.UploadedFiles
                .Include(uf => uf.Documents)
                .FirstOrDefaultAsync(uf => uf.Id == id);

            if (uploadedFile == null)
                return NotFound($"No se encontró el archivo con ID {id}");

            // Primero eliminar todos los documentos asociados
            if (uploadedFile.Documents != null && uploadedFile.Documents.Any())
            {
                _context.Documents.RemoveRange(uploadedFile.Documents);
            }

            // Luego eliminar el archivo subido
            _context.UploadedFiles.Remove(uploadedFile);

            // Guardar los cambios en la base de datos
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Archivo y sus documentos asociados eliminados correctamente",
                fileName = uploadedFile.FileName,
                totalDocumentsDeleted = uploadedFile.Documents?.Count ?? 0
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error al eliminar el archivo: {ex.Message}");
        }
    }
}