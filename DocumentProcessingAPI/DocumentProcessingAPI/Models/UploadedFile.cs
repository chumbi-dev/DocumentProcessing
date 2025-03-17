namespace DocumentProcessingAPI.Models;

public class UploadedFile
{
    public int Id { get; set; }
    public DateTime UploadDate { get; set; } = DateTime.UtcNow;
    public string FileName { get; set; }

    public ICollection<Document> Documents { get; set; }
}
