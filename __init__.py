from .magik_mega_panel import MagikMegaPanel

NODE_CLASS_MAPPINGS = {
    "MagikMegaPanel": MagikMegaPanel,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "MagikMegaPanel": "Magik Mega Panel",
}

WEB_DIRECTORY = "./js"

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]
