const resources = {"shader.glslf":"precision mediump float;\n\nuniform float time;\n\nuniform vec3 player;\n\nuniform sampler2D colorMap;\nuniform sampler2D normalMap;\n\nvarying vec3 fragmentPosition;\nvarying vec4 fragmentNormal;\nvarying vec2 fragmentUV;\n\n\nvec3 transformQuat(vec3 a, vec4 q) {\n    vec4 i = vec4( q.w * a.x + q.y * a.z - q.z * a.y,\n                   q.w * a.y + q.z * a.x - q.x * a.z,\n                   q.w * a.z + q.x * a.y - q.y * a.x,\n                  -q.x * a.x - q.y * a.y - q.z * a.z);\n\n    return vec3( i.x * q.w + i.w * -q.x + i.y * -q.z - i.z * -q.y,\n                 i.y * q.w + i.w * -q.y + i.z * -q.x - i.x * -q.z,\n                 i.z * q.w + i.w * -q.z + i.x * -q.y - i.y * -q.x);\n}\n\nvoid main(void) {\n    vec3 lightVector = player-fragmentPosition;\n    vec3 lightDir = normalize(lightVector);\n    float lightDistance = length(lightVector);\n    vec4 textureNormal = texture2D(normalMap, fragmentUV) * 2.0 - 1.0;\n    vec3 normal = transformQuat(textureNormal.rgb, fragmentNormal);\n    float light = dot(normal, lightDir) * 2.0 / sqrt(lightDistance);\n    gl_FragColor = vec4(texture2D(colorMap, fragmentUV).rgb * light, 1.0);\n}\n\n","shader.glslv":"attribute vec3 vertexPosition;\nattribute vec4 vertexNormal;\nattribute vec2 vertexUV;\n\nvarying vec3 fragmentPosition;\nvarying vec4 fragmentNormal;\nvarying vec2 fragmentUV;\n\nuniform mat4 transform;\n\nvoid main(void) {\n    fragmentPosition = vertexPosition;\n    fragmentNormal = vertexNormal;\n    fragmentUV = vertexUV;\n    gl_Position = transform * vec4(vertexPosition, 1.0);\n}\n","tiles.png":"data:image/png;base64,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","tiles_normal.png":"data:image/png;base64,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QAghARBCSACEEBIAIYQEQAghARBCSACEEBIAIYQEQAghARBCSACEEBIAIYQEQAghARBCSACEEBIAIYQEQAghARBCSACEEBIAISQAQggJgBBCAiCEkAAIISQAQggJgBBCAiCEkAAIISQAQggJgBBCAiCEkAAIISQAQggJgBBCAiCEkAAIISQAQggJgBBCAiCEkAAIISQAQggJgBBCAiCEkAAIISQAQggJgBBCAiCEkAAIISQAQggJgBBCAiCEkAAZUMiJAAABR0lEQVQIISQAQggJgBBCAiCEkAAIISQAQkgAhBASACGEBEAIIQEQQkgAhBASACGEBEAIIQEQQkgAhBASACGEBEAIIQEQQkgAhBASACGEBEAIIQEQQkgAhBASACGEBEAIIQEQQkgAhBASACGEBEAIIQEQQkgAhBASACGEBEAIIQEQQkgAhBASACGEBEAIIQEQQkgAhBASACGEBEAIIQEQQkgAhJAACCEkAEIICYAQQgIghJAACCEkAEIICYAQQgIghJAACCEkAEIICYAQQgIghJAACCEkAEIICYAQQgIghJAACCEkAEIICYAQQgIghJAACCEkAEIICYAQQgIghJAACCEkAEIICYAQQgIghJAACCEkAEIICYAQQgIghJAACCEkAEIICYAQQgIghJAACCEBEEJIAIQQEgAhhARACCEBEEJIAIQQf3r8f+g0B1ExbBOkAAAAAElFTkSuQmCC"}