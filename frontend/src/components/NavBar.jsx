import React, { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Disclosure } from "@headlessui/react";
import { Bars3Icon } from "@heroicons/react/24/outline";
import axios from "axios";
import { Avatar, Modal } from "antd";
import SideBar from "../components/SideBar";
import { History, LogOut } from "lucide-react";
export default function Navbar({
  Token,
  settoken,
  Address,
  setAddress,
  network,
  setNetwork,
}) {
  const [networks, setNetworks] = useState([]);
  const [Tokens, settokens] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpen2, setIsModalOpen2] = useState(false);

  // Check session storage for address on component mount
  useEffect(() => {
    const storedAddress = window.sessionStorage.getItem("address");
    if (storedAddress) {
      setAddress(storedAddress);
    }
  }, [setAddress]);

  const showModal = () => {
    setIsModalOpen(true);
  };
  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const fetchTokens = async (chainuid) => {
    const payload = {
      query: `
      query Factory($chainUid: String!) {
        factory(chain_uid: $chainUid) {
          all_tokens {
            tokens
          }
        }
      }
    `,
      variables: { chainUid: chainuid },
    };

    try {
      const response = await axios.post(
        "https://testnet.api.euclidprotocol.com/graphql",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const tokens = response.data.data.factory.all_tokens.tokens;
      settokens(tokens);
      return tokens;
    } catch (error) {
      console.error("Error fetching tokens:", error);
      return null;
    }
  };

  const fetchNetworks = async () => {
    try {
      const data = await axios.get(
        "https://testnet.api.euclidprotocol.com/api/v1/chains"
      );
      setNetworks(data?.data);
      showModal();
    } catch (error) {
      console.error("Error fetching networks:", error);
    }
  };

  const checkLeapWallet = async () => {
    if (typeof window.leap !== "undefined") {
      return true;
    } else {
      toast.error("Leap Wallet not installed");
      return false;
    }
  };

  const connectWallet = async () => {
    const leapAvailable = await checkLeapWallet();
    if (!leapAvailable) return;

    if (!network || !network.chain_id || !network.chain_uid) {
      toast.error("Network details missing. Please select a network.");
      return;
    }

    try {
      const key = await window.leap.getKey(network.chain_id);
      setAddress(key.bech32Address);
      window.sessionStorage.setItem("address", key.bech32Address);
      window.sessionStorage.setItem("chain_id", network.chain_id);
      window.sessionStorage.setItem("chain_uid", network.chain_uid);

      await window.leap.enable(network.chain_id);
    } catch (error) {
      console.error("Error connecting to Leap Wallet:", error);
      toast.error("Failed to connect to Leap Wallet");
    }
  };

  const logout = () => {
    window.sessionStorage.clear();
    setAddress(null);
    setNetwork(null);
    settoken(null);
    toast.success("Logged out successfully");
  };

  return (
    <nav className="bg-gray-800 text-white sticky top-0 w-full z-10 shadow-md ">
      <div className="px-4 sm:px-6 lg:px-8 w-full">
        <div className="relative flex h-16 items-center justify-between">
          <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            {/* <Disclosure.Button className="inline-flex items-center justify-center p-2 text-gray-400 hover:bg-gray-700 hover:text-white rounded-md focus:outline-none">
              <span className="sr-only">Open main menu</span>
              <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
            </Disclosure.Button> */}
          </div>
          <div className="flex  items-center justify-center sm:items-stretch sm:justify-start">
            <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-700">
              ChainGamble
            </div>
          </div>
          <div className="hidden sm:flex items-center space-x-4">
            {/* Sidebar Button */}
            <SideBar />
            {Address ? (
              <button
                onClick={logout}
                className="bg-red-800 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-all flex items-center gap-2"
              >
                <LogOut className="h-[20px]" />
                Logout
              </button>
            ) : (
              <button
                className="bg-blue-800 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-all"
                onClick={() => fetchNetworks()}
              >
                Connect
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Network Selection Modal */}
      <Modal
        title="Select Network"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        centered
        bodyStyle={{
          padding: "20px",
          backgroundColor: "#1F2937", // Darker gray background
          borderRadius: "8px",
        }}
        titleStyle={{
          color: "#F6E05E", // Yellow color
          fontSize: "1.25rem",
          fontWeight: "bold",
          textAlign: "center",
        }}
      >
        <div className="space-y-4">
          {networks?.map((network, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 rounded-lg bg-gray-700 hover:bg-gray-600 cursor-pointer"
              onClick={() => {
                setNetwork(network);
                handleCancel();
                fetchTokens(network.chain_uid);
                setIsModalOpen2(true);
              }}
            >
              <Avatar src={network.logo} className="mr-3" />
              <div>
                <p className="text-white font-semibold">{network.chain_uid}</p>
                <p className="text-gray-400 text-sm">
                  Chain ID: {network.chain_id}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* Token Selection Modal */}
      <Modal
        title="Select Token"
        open={isModalOpen2}
        onCancel={() => setIsModalOpen2(false)}
        footer={null}
        centered
        className="bg-black bg-opacity-25 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] backdrop-blur-[6.5px] rounded-lg border border-white border-opacity-20 p-6"
        titleStyle={{
          color: "#F6E05E",
          fontSize: "1.25rem",
          fontWeight: "bold",
          textAlign: "center",
        }}
      >
        <div className="space-y-4 ">
          {Tokens?.map((token, index) => (
            <div
              key={index}
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 cursor-pointer flex justify-between items-center"
              onClick={() => {
                settoken(token);
                window.sessionStorage.setItem("token", token);
                setIsModalOpen2(false);
                connectWallet();
              }}
            >
              <p className="text-white font-semibold">{token}</p>
            </div>
          ))}
        </div>
      </Modal>
    </nav>
  );
}
