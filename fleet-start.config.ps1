# Per-repo fleet start config for uitars-mcp
# Edit ports/backend target here - start.ps1 is fleet-standard.
@{
    Name         = 'uitars-mcp'
    BackendPort  = 10976
    FrontendPort = 10977
    HealthPath   = '/api/health'
    WebRoot      = 'D:\Dev\repos\uitars-mcp\web_sota'
    Backend = @{
        Kind          = 'uvicorn'
        UvicornTarget = 'uitars_mcp.app:app'
        SyncExtras    = @('dev')
        Env           = @{ WEB_PORT = '10976' }
    }
    Frontend = @{
        Kind           = 'vite-npm'
        PackageManager = 'npm'
        PortEnvVar     = 'VITE_PORT'
        ApiTargetEnv   = 'VITE_API_TARGET'
    }
}
