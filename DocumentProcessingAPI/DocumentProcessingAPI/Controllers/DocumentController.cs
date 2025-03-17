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
public class DocumentsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public DocumentsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public IActionResult GetDocuments()
    {
        var documents = _context.Documents.OrderByDescending(x => x.Id).ToList();
        return Ok(documents);
    }

    [HttpGet("{id}")]
    public IActionResult GetDocument(int id)
    {
        var document = _context.Documents.Find(id);
        if (document == null)
            return NotFound("Registro de Documento no encontrado.");

        return Ok(document);
    }
}
