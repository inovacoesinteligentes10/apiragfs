"""
Configuracao do cliente MinIO
"""
from minio import Minio
from minio.error import S3Error
from io import BytesIO
from .settings import settings


class MinIOClient:
    """Gerenciador de conexoes com MinIO"""

    def __init__(self):
        self.client = Minio(
            endpoint=settings.minio_endpoint,
            access_key=settings.minio_access_key,
            secret_key=settings.minio_secret_key,
            secure=settings.minio_secure
        )
        self.bucket = settings.minio_bucket

    def ensure_bucket(self):
        """Garante que o bucket existe"""
        try:
            if not self.client.bucket_exists(bucket_name=self.bucket):
                self.client.make_bucket(bucket_name=self.bucket)
        except S3Error as e:
            print(f"Erro ao criar bucket: {e}")

    def upload_file(self, file_content: bytes, object_name: str, content_type: str = "application/octet-stream") -> str:
        """
        Faz upload de arquivo para MinIO a partir de bytes

        Args:
            file_content: Conteúdo do arquivo em bytes
            object_name: Nome do objeto no MinIO
            content_type: Tipo MIME do arquivo

        Returns:
            URL do objeto no MinIO
        """
        try:
            file_stream = BytesIO(file_content)
            file_size = len(file_content)

            self.client.put_object(
                bucket_name=self.bucket,
                object_name=object_name,
                data=file_stream,
                length=file_size,
                content_type=content_type
            )

            # Retornar URL do objeto
            return f"{self.bucket}/{object_name}"

        except S3Error as e:
            raise Exception(f"Erro ao fazer upload para MinIO: {str(e)}")

    def get_presigned_url(self, object_name: str, expires: int = 3600) -> str:
        """Gera URL pre-assinada para download"""
        try:
            return self.client.presigned_get_object(
                bucket_name=self.bucket,
                object_name=object_name,
                expires=expires
            )
        except S3Error as e:
            print(f"Erro ao gerar URL: {e}")
            return ""

    def delete_file(self, object_name: str):
        """Remove arquivo do MinIO"""
        try:
            self.client.remove_object(
                bucket_name=self.bucket,
                object_name=object_name
            )
            return True
        except S3Error as e:
            print(f"Erro ao deletar arquivo: {e}")
            return False

    def get_storage_stats(self):
        """Retorna estatísticas de armazenamento do bucket"""
        try:
            objects = self.client.list_objects(bucket_name=self.bucket, recursive=True)
            total_size = 0
            file_count = 0

            for obj in objects:
                total_size += obj.size
                file_count += 1

            return {
                "used": total_size,
                "files": file_count,
                "bucket": self.bucket
            }
        except Exception as e:
            print(f"Erro ao obter estatísticas: {e}")
            return {
                "used": 0,
                "files": 0,
                "bucket": self.bucket
            }


# Instância global
minio_client = MinIOClient()
