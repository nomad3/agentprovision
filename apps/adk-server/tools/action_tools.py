"""Action and reporting tools.

Handles report generation, visualizations, and exports.
"""
from typing import Optional
import json


def generate_report(
    title: str,
    sections: list[dict],
    format: str = "markdown",
) -> dict:
    """Generate structured report from analysis results.

    Args:
        title: Report title
        sections: List of sections with:
            - heading: Section title
            - content_type: 'chart', 'table', or 'text'
            - data: Content data
        format: Output format ('markdown', 'html')

    Returns:
        Formatted report content
    """
    if format == "markdown":
        report = f"# {title}\n\n"
        for section in sections:
            report += f"## {section.get('heading', 'Section')}\n\n"
            content_type = section.get('content_type', 'text')
            data = section.get('data', '')

            if content_type == 'text':
                report += f"{data}\n\n"
            elif content_type == 'table':
                # Format as markdown table
                if isinstance(data, list) and len(data) > 0:
                    headers = list(data[0].keys())
                    report += "| " + " | ".join(headers) + " |\n"
                    report += "| " + " | ".join(["---"] * len(headers)) + " |\n"
                    for row in data:
                        report += "| " + " | ".join(str(row.get(h, '')) for h in headers) + " |\n"
                    report += "\n"
            elif content_type == 'chart':
                report += f"[Chart: {section.get('heading', 'Chart')}]\n\n"
                report += f"```json\n{json.dumps(data, indent=2)}\n```\n\n"

        return {
            "format": format,
            "content": report,
            "title": title,
            "section_count": len(sections),
        }
    else:
        return {"error": f"Unsupported format: {format}"}


def create_visualization(
    data: dict,
    chart_type: str,
    config: dict,
) -> dict:
    """Create chart specification for frontend rendering.

    Args:
        data: Data to visualize (rows, columns)
        chart_type: Type (bar, line, pie, scatter, heatmap, funnel, sankey)
        config: Chart configuration:
            - title: Chart title
            - x_axis: X-axis column
            - y_axis: Y-axis column(s)
            - color: Color column (optional)
            - labels: Show labels (boolean)

    Returns:
        Chart specification for frontend
    """
    valid_types = ["bar", "line", "pie", "scatter", "heatmap", "funnel", "sankey"]
    if chart_type not in valid_types:
        return {"error": f"Invalid chart type. Must be one of: {valid_types}"}

    spec = {
        "type": chart_type,
        "data": data,
        "config": {
            "title": config.get("title", "Chart"),
            "x_axis": config.get("x_axis"),
            "y_axis": config.get("y_axis"),
            "color": config.get("color"),
            "labels": config.get("labels", True),
        },
    }

    return {
        "chart_spec": spec,
        "chart_type": chart_type,
        "note": "Render this specification in the frontend visualization library",
    }


async def export_data(
    dataset_id: str,
    format: str,
    destination: dict,
) -> str:
    """Export dataset to external destination.

    Args:
        dataset_id: Dataset to export
        format: Export format (csv, json, parquet)
        destination: Where to export:
            - type: 'gcs', 's3', 'email', 'webhook'
            - path: Destination path or URL

    Returns:
        Export job ID or download URL
    """
    valid_formats = ["csv", "json", "parquet"]
    if format not in valid_formats:
        return f"Invalid format. Must be one of: {valid_formats}"

    valid_destinations = ["gcs", "s3", "email", "webhook"]
    dest_type = destination.get("type", "")
    if dest_type not in valid_destinations:
        return f"Invalid destination type. Must be one of: {valid_destinations}"

    # This would integrate with actual export service
    return {
        "status": "queued",
        "dataset_id": dataset_id,
        "format": format,
        "destination": destination,
        "note": "Export will be processed asynchronously",
    }
