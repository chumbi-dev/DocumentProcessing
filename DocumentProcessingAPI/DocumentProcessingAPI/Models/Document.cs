namespace DocumentProcessingAPI.Models;

public class Document
{
    public int Id { get; set; }
    public string PdfName { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public int Age { get; set; }
    public string Address { get; set; }
    public string SSN { get; set; }
    public int UploadedFileId { get; set; }
}
