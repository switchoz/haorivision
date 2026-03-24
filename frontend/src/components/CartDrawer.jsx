import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../contexts/CartContext";
import { useTheme } from "../contexts/ThemeContext";
import { useNavigate } from "react-router-dom";

const CartDrawer = () => {
  const {
    items,
    isOpen,
    setIsOpen,
    removeItem,
    updateQty,
    totalPrice,
    totalItems,
  } = useCart();
  const { isUVMode } = useTheme();
  const navigate = useNavigate();

  const handleCheckout = () => {
    setIsOpen(false);
    navigate("/checkout", { state: { fromCart: true } });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-zinc-950 border-l border-zinc-800 z-[70] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-800">
              <h2
                className={`text-xl font-bold ${isUVMode ? "gradient-text" : "text-white"}`}
              >
                Корзина ({totalItems})
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-white transition-colors p-1"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {items.length === 0 ? (
                <div className="text-center py-16">
                  <svg
                    className="w-16 h-16 text-zinc-700 mx-auto mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
                    />
                  </svg>
                  <p className="text-zinc-500">Корзина пуста</p>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      navigate("/shop");
                    }}
                    className="mt-4 text-purple-400 hover:text-purple-300 text-sm underline"
                  >
                    Перейти в магазин
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex gap-4 bg-zinc-900 border border-zinc-800 rounded-lg p-3"
                  >
                    {/* Image */}
                    <div className="w-20 h-24 flex-shrink-0 rounded overflow-hidden bg-zinc-800">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600 text-2xl">
                          👘
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-zinc-500 text-xs truncate">
                        {item.collection}
                      </p>
                      <h4 className="text-white text-sm font-medium truncate">
                        {item.name}
                      </h4>
                      <p
                        className={`text-sm font-bold mt-1 ${isUVMode ? "text-uv-cyan" : "text-white"}`}
                      >
                        ${item.price.toLocaleString()}
                      </p>

                      {/* Qty controls */}
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQty(item.id, item.qty - 1)}
                          className="w-7 h-7 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 flex items-center justify-center text-sm"
                        >
                          -
                        </button>
                        <span className="text-white text-sm w-6 text-center">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => updateQty(item.id, item.qty + 1)}
                          className="w-7 h-7 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 flex items-center justify-center text-sm"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="ml-auto text-zinc-500 hover:text-red-400 transition-colors"
                          title="Удалить"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-zinc-800 p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Итого</span>
                  <span
                    className={`text-2xl font-bold ${isUVMode ? "text-uv-cyan" : "text-white"}`}
                  >
                    ${totalPrice.toLocaleString()}
                  </span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCheckout}
                  className={`w-full py-4 rounded-full font-semibold text-lg transition-all ${
                    isUVMode
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
                      : "bg-white text-black hover:bg-zinc-200"
                  }`}
                >
                  Оформить заказ
                </motion.button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
                >
                  Продолжить покупки
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
