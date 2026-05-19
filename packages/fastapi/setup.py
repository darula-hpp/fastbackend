from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="fastbackend-fastapi",
    version="0.1.0",
    author="FastBackend Team",
    description="FastAPI runtime adapter for FastBackend framework",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/darula-hpp/uigen/tree/main/fastbackend",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
    ],
    python_requires=">=3.10",
    install_requires=[
        "fastapi>=0.110.0",
        "pydantic[email]>=2.0.0",
        "sqlalchemy>=2.0.0",
        "uvicorn>=0.27.0",
        "email-validator>=2.0.0",
    ],
    extras_require={
        "dev": [
            "pytest>=8.0.0",
            "pytest-asyncio>=0.23.0",
            "httpx>=0.27.0",
            "ruff>=0.3.0",
            "black>=24.0.0",
        ],
    },
)
