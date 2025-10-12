import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Swal from "sweetalert2";

function FileDropzone({ uploadedFiles, onFilesChange, maxFiles, maxSize = 10 * 1024 * 1024, accept }) {
    const onDrop = useCallback((acceptedFiles) => {
        const newFiles = [...uploadedFiles, ...acceptedFiles].slice(0, maxFiles);
        onFilesChange(newFiles);
    }, [uploadedFiles, onFilesChange, maxFiles]);

    const onDropRejected = useCallback((fileRejections) => {
        if (!fileRejections.length) return;

        // Build a formatted error list
        const formattedErrors = fileRejections.map(({ file, errors }, idx) => {
            const errorMessages = errors
                .map(err => {
                    // Clean up hyphenated error codes into readable text
                    let readable = err.message || err.code.replace(/-/g, " ");
                    // Add a bit more context where needed
                    if (err.code === "file-too-large") {
                        readable = `File too large (limit: ${Math.round(maxSize / 1024 / 1024)} MB)`;
                    } else if (err.code === "too-many-files") {
                        readable = `Too many files (max: ${maxFiles})`;
                    } else if (err.code === "file-invalid-type") {
                        readable = `Invalid file type (only JPG/PNG allowed)`;
                    }
                    return readable;
                })
                .join(", ");

            return `<li><b>${idx + 1}. ${file.name}</b> — ${errorMessages}</li>`;
        });

        Swal.fire({
            icon: "error",
            title: "Some files couldn’t be uploaded",
            html: `<ul style="text-align:left; margin-left:20px;">${formattedErrors.join("")}</ul>`,
            background: "#1e1e1e",
            color: "#fff",
            confirmButtonColor: "#28a745",
            width: 600,
        });
    }, [maxFiles, maxSize]);

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        onDropRejected,
        accept,
        maxFiles,
        maxSize,
    });

    const removeFile = (index) => {
        const newList = uploadedFiles.filter((_, i) => i !== index);
        onFilesChange(newList);
    };

    const showPreview = (file) => {
        const previewUrl = URL.createObjectURL(file);
        Swal.fire({
            title: file.name,
            imageUrl: previewUrl,
            imageAlt: file.name,
            showCloseButton: true,
            showConfirmButton: false,
            width: 600,
            background: "#1e1e1e",
            color: "#fff",
            didClose: () => URL.revokeObjectURL(previewUrl),
        });
    };

    return (
        <div>
            {/* Dropzone visible until file count hits maxFiles */}
            {uploadedFiles.length < maxFiles && (
                <div
                    {...getRootProps()}
                    style={{
                        border: "2px dotted green",
                        borderRadius: "10px",
                        fontSize: "x-large",
                        fontWeight: "bolder",
                        padding: "20px",
                        minHeight: "150px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <input {...getInputProps()} />
                    <span className="text-white">
                        Drag 'n' drop some files here, or click to select files
                        <br />
                        <small className="text-secondary">
                            (Max {maxFiles} file{maxFiles > 1 ? "s" : ""}, up to {Math.round(maxSize / 1024 / 1024)} MB each)
                        </small>
                    </span>
                </div>
            )}

            {/* Uploaded files section */}
            {uploadedFiles.length > 0 && (
                <div className="fs-5 text-white mt-3">
                    <div className="d-flex flex-wrap gap-3">
                        {uploadedFiles.map((file, i) => (
                            <div
                                key={i}
                                className="p-3 rounded border border-secondary text-center"
                                style={{
                                    background: "#2a2a2a",
                                    width: "150px",
                                    boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
                                }}
                            >
                                <div
                                    className="fw-bold text-truncate"
                                    style={{ maxWidth: "120px" }}
                                    title={file.name}
                                >
                                    {file.name}
                                </div>
                                <div className="mt-2 d-flex justify-content-center gap-2">
                                    {
                                        file.type.startsWith("image/") && (
                                            <button
                                                className="btn btn-outline-info btn-sm"
                                                title="View"
                                                onClick={() => showPreview(file)}
                                            >
                                                <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                                                    <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0" />
                                                    <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7" />
                                                </svg>
                                            </button>
                                        )
                                    }
                                    <button
                                        className="btn btn-outline-danger btn-sm"
                                        title="Remove"
                                        onClick={() => removeFile(i)}
                                    >
                                        🗙
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default FileDropzone;
