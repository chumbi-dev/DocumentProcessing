using DocumentProcessingAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace DocumentProcessingAPI
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        public DbSet<Document> Documents { get; set; }
        public DbSet<UploadedFile> UploadedFiles { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configurar relación entre Document y UploadedFile
            modelBuilder.Entity<Document>()
                .HasOne<UploadedFile>() 
                .WithMany(u => u.Documents)
                .HasForeignKey(d => d.UploadedFileId);

            // Asegurar que FileName no sea nulo
            modelBuilder.Entity<UploadedFile>()
                .Property(u => u.FileName)
                .IsRequired();
        }
    }
}