#!/usr/bin/env python3
"""
Script para testar verificação de senha
"""
import bcrypt

# Hash armazenado no banco
stored_hash = "$2b$12$7NhJd55pqVaZILRO60YXY.GxwXPNlX/qZXRHPniFUBLCPH2J0h33i"

# Senha a testar
test_password = "admin123"

print("=" * 70)
print("🔐 TESTE DE VERIFICAÇÃO DE SENHA")
print("=" * 70)
print(f"Email: admin@unifesp.br")
print(f"Senha testada: {test_password}")
print(f"Hash no banco: {stored_hash}")
print("=" * 70)

# Converter para bytes
password_bytes = test_password.encode('utf-8')
hash_bytes = stored_hash.encode('utf-8')

# Verificar
try:
    result = bcrypt.checkpw(password_bytes, hash_bytes)
    
    if result:
        print("✅ SENHA CORRETA - A senha 'admin123' corresponde ao hash!")
    else:
        print("❌ SENHA INCORRETA - A senha 'admin123' NÃO corresponde ao hash!")
        print("\n💡 Vou gerar o hash correto para 'admin123':")
        
        # Gerar novo hash
        salt = bcrypt.gensalt()
        new_hash = bcrypt.hashpw(password_bytes, salt)
        print(f"\nNovo hash para 'admin123': {new_hash.decode('utf-8')}")
        
except Exception as e:
    print(f"❌ ERRO ao verificar: {str(e)}")

print("=" * 70)
